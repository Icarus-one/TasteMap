import { hasSupabasePublicEnv } from "@/lib/env";
import { restaurantMatchQuerySchema } from "@/lib/validators";
import { jsonError, jsonOk } from "@/server/http";
import { searchLocalRestaurantMatches } from "@/server/localStore";
import { assertSameOrigin, requireSecureRouteSession } from "@/server/security";
import { recordAnalyticsEvent } from "@/server/services/analytics";
import { searchRestaurantMatchCandidates } from "@/server/services/restaurantMatches";

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const json = await request.json().catch(() => null);
  const parsed = restaurantMatchQuerySchema.safeParse(json);

  if (!parsed.success) {
    return jsonError("Invalid restaurant match query.", 400, {
      issues: parsed.error.flatten(),
    });
  }

  if (!hasSupabasePublicEnv()) {
    const candidates = await searchLocalRestaurantMatches(parsed.data);
    return jsonOk({ candidates, storage_mode: "local" });
  }

  const session = await requireSecureRouteSession(request);
  if (!session.ok) {
    return session.response;
  }

  const candidates = await searchRestaurantMatchCandidates({
    supabase: session.supabase,
    userId: session.user.id,
    query: parsed.data,
  });

  await recordAnalyticsEvent({
    supabase: session.supabase,
    userId: session.user.id,
    eventName: "restaurant_match_searched",
    metadata: {
      result_count: candidates.length,
      has_location: Boolean(parsed.data.latitude && parsed.data.longitude),
      has_provider_place_id: Boolean(parsed.data.provider_place_id),
    },
  });

  return jsonOk({ candidates, storage_mode: "supabase" });
}
