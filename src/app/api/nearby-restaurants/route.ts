import { nearbyRestaurantsInputSchema } from "@/lib/validators";
import {
  checkRateLimit,
  requireSecureRouteSession,
} from "@/server/security";
import { recordAnalyticsEvent } from "@/server/services/analytics";

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  primaryTypeDisplayName?: { text?: string };
  types?: string[];
};

export async function POST(request: Request) {
  const session = await requireSecureRouteSession(request);
  if (!session.ok) {
    return session.response;
  }

  const rateLimitError = checkRateLimit({
    key: `nearby-restaurants:${session.user.id}`,
    limit: 60,
    windowMs: 10 * 60 * 1000,
  });
  if (rateLimitError) return rateLimitError;

  const json = await request.json().catch(() => null);
  const parsed = nearbyRestaurantsInputSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid nearby restaurant input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!process.env.PLACES_API_KEY) {
    await recordAnalyticsEvent({
      supabase: session.supabase,
      userId: session.user.id,
      eventName: "nearby_restaurants_searched",
      metadata: { result_count: 0, used_fallback: true },
    });

    return Response.json({
      candidates: [],
      warning: "PLACES_API_KEY is not configured. Use manual restaurant entry.",
    });
  }

  const { latitude, longitude, radius_meters } = parsed.data;
  const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.PLACES_API_KEY,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.rating",
        "places.primaryTypeDisplayName",
        "places.types",
      ].join(","),
    },
    body: JSON.stringify({
      includedTypes: ["restaurant"],
      maxResultCount: 10,
      rankPreference: "DISTANCE",
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: radius_meters,
        },
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    await recordAnalyticsEvent({
      supabase: session.supabase,
      userId: session.user.id,
      eventName: "nearby_restaurants_searched",
      metadata: { result_count: 0, used_fallback: true },
    });

    return Response.json(
      {
        candidates: [],
        error: message || "Places API search failed.",
      },
      { status: 200 },
    );
  }

  const payload = (await response.json()) as { places?: GooglePlace[] };
  const candidates = (payload.places ?? []).map((place) => {
    const placeLat = place.location?.latitude ?? null;
    const placeLng = place.location?.longitude ?? null;
    return {
      provider: "google_places",
      provider_place_id: place.id ?? "",
      name: place.displayName?.text ?? "Unknown restaurant",
      address: place.formattedAddress ?? null,
      latitude: placeLat,
      longitude: placeLng,
      distance_meters:
        placeLat !== null && placeLng !== null
          ? distanceMeters(
              { latitude, longitude },
              { latitude: placeLat, longitude: placeLng },
            )
          : null,
      provider_rating: place.rating ?? null,
      cuisine_or_category:
        place.primaryTypeDisplayName?.text ?? place.types?.[0] ?? "Restaurant",
      raw: place,
    };
  });

  candidates.sort((a, b) => {
    const first = a.distance_meters ?? Number.MAX_SAFE_INTEGER;
    const second = b.distance_meters ?? Number.MAX_SAFE_INTEGER;
    return first - second;
  });

  const results = candidates.slice(0, 10);
  await recordAnalyticsEvent({
    supabase: session.supabase,
    userId: session.user.id,
    eventName: "nearby_restaurants_searched",
    metadata: { result_count: results.length, used_fallback: false },
  });

  return Response.json({ candidates: results });
}

function distanceMeters(
  first: { latitude: number; longitude: number },
  second: { latitude: number; longitude: number },
) {
  const radius = 6371000;
  const dLat = toRadians(second.latitude - first.latitude);
  const dLng = toRadians(second.longitude - first.longitude);
  const lat1 = toRadians(first.latitude);
  const lat2 = toRadians(second.latitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
