import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import { createVisitSchema } from "@/lib/validators";
import { upsertRestaurantAlias } from "@/server/services/restaurantMatches";
import type { Confidence, LocationSource } from "@/lib/types";

export type CreateVisitInput = z.infer<typeof createVisitSchema>;

export async function createVisitFromPhotoRecord({
  supabase,
  userId,
  input,
}: {
  supabase: SupabaseClient;
  userId: string;
  input: CreateVisitInput;
}) {
  const restaurantResult = await resolveRestaurant({
    supabase,
    userId,
    restaurant: input.restaurant,
    dishes: input.dishes,
  });

  if ("error" in restaurantResult) {
    return { error: restaurantResult.error, status: 400 as const };
  }

  await upsertRestaurantAlias({
    supabase,
    userId,
    restaurantId: restaurantResult.restaurantId,
    aliasName: input.restaurant.input_name ?? input.restaurant.name,
    canonicalName: restaurantResult.restaurantName,
    source: input.restaurant.mode === "provider" ? "places_api" : "user_input",
  }).catch(() => undefined);

  const { data: visit, error: visitError } = await supabase
    .from("visits")
    .insert({
      user_id: userId,
      restaurant_id: restaurantResult.restaurantId,
      visit_date: input.visit.visit_date ?? null,
      taken_at: input.visit.taken_at ?? null,
      companions: input.visit.companions ?? null,
      average_price: input.visit.average_price ?? null,
      total_score: input.visit.total_score,
      will_revisit: input.visit.will_revisit,
      summary: input.visit.summary ?? null,
      detailed_review: input.visit.detailed_review ?? null,
      recommended_dishes: summarizeDishVotes(input.dishes, "recommended"),
      bad_dishes: summarizeDishVotes(input.dishes, "bad"),
      suitable_scenarios: input.visit.tags ?? [],
      location_source: input.visit.location_source,
      location_confidence: confidenceForLocation(input.visit.location_source),
      restaurant_match_source: input.visit.restaurant_match_source,
      ai_generated:
        input.photos.some((photo) => photo.ai_analysis_json) ||
        input.dishes.some((dish) => dish.name_ai_guess),
      user_confirmed: true,
    })
    .select("id")
    .single();

  if (visitError || !visit) {
    return {
      error: visitError?.message ?? "Could not create visit.",
      status: 500 as const,
    };
  }

  const dishRows = input.dishes.map((dish) => ({
    user_id: userId,
    restaurant_id: restaurantResult.restaurantId,
    visit_id: visit.id,
    name: dish.name,
    name_ai_guess: dish.name_ai_guess ?? null,
    cuisine_guess: dish.cuisine_guess ?? null,
    category: dish.category ?? null,
    visible_ingredients: dish.visible_ingredients ?? [],
    ai_confidence: dish.ai_confidence,
    user_confirmed: dish.user_confirmed,
    is_recommended: dish.is_recommended,
    is_bad: dish.is_bad,
  }));

  const { data: insertedDishes, error: dishesError } = dishRows.length
    ? await supabase.from("dishes").insert(dishRows).select("id")
    : { data: [], error: null };

  if (dishesError) {
    return { error: dishesError.message, status: 500 as const };
  }

  const firstDishId = insertedDishes?.[0]?.id ?? null;
  const photoRows = input.photos.map((photo) => ({
    user_id: userId,
    restaurant_id: restaurantResult.restaurantId,
    visit_id: visit.id,
    dish_id: firstDishId,
    storage_path: photo.storage_path,
    public_url: photo.public_url ?? null,
    photo_type: photo.photo_type,
    taken_at: photo.taken_at ?? null,
    exif_exists: photo.exif_exists,
    exif_latitude: photo.exif_latitude ?? null,
    exif_longitude: photo.exif_longitude ?? null,
    location_source: photo.location_source,
    ai_analysis_json: photo.ai_analysis_json ?? null,
    ai_detected_dishes:
      typeof photo.ai_analysis_json === "object" &&
      photo.ai_analysis_json !== null &&
      "detectedDishes" in photo.ai_analysis_json
        ? photo.ai_analysis_json.detectedDishes
        : null,
    ai_confidence: photo.ai_confidence,
  }));

  const { error: photosError } = photoRows.length
    ? await supabase.from("photos").insert(photoRows)
    : { error: null };

  if (photosError) {
    return { error: photosError.message, status: 500 as const };
  }

  await supabase
    .from("restaurants")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", restaurantResult.restaurantId)
    .eq("user_id", userId);

  return {
    visitId: visit.id,
    restaurantId: restaurantResult.restaurantId,
  };
}

async function resolveRestaurant({
  supabase,
  userId,
  restaurant,
  dishes,
}: {
  supabase: SupabaseClient;
  userId: string;
  restaurant: CreateVisitInput["restaurant"];
  dishes: CreateVisitInput["dishes"];
}): Promise<
  { restaurantId: string; restaurantName: string } | { error: string }
> {
  const derivedCuisineType =
    restaurant.cuisine_type ?? deriveCuisineTypeFromDishes(dishes) ?? null;

  if (restaurant.mode === "existing" && restaurant.restaurant_id) {
    if (derivedCuisineType) {
      await supabase
        .from("restaurants")
        .update({
          cuisine_type: derivedCuisineType,
          updated_at: new Date().toISOString(),
        })
        .eq("id", restaurant.restaurant_id)
        .eq("user_id", userId);
    }
    const { data } = await supabase
      .from("restaurants")
      .select("id, name")
      .eq("id", restaurant.restaurant_id)
      .eq("user_id", userId)
      .single();

    if (!data) return { error: "Selected restaurant was not found." };
    return { restaurantId: data.id, restaurantName: data.name };
  }

  if (restaurant.mode === "provider" && restaurant.provider_place_id) {
    const { data: existing } = await supabase
      .from("restaurants")
      .select("id, name")
      .eq("user_id", userId)
      .eq("provider_place_id", restaurant.provider_place_id)
      .maybeSingle();

    if (existing) {
      return { restaurantId: existing.id, restaurantName: existing.name };
    }
  }

  const { data: created, error: createError } = await supabase
    .from("restaurants")
    .insert({
      user_id: userId,
      name: restaurant.name,
      city: restaurant.city ?? null,
      country: restaurant.country ?? null,
      address: restaurant.address ?? null,
      latitude: restaurant.latitude ?? null,
      longitude: restaurant.longitude ?? null,
      cuisine_type: derivedCuisineType,
      provider_place_id: restaurant.provider_place_id ?? null,
      provider_name:
        restaurant.provider_name ??
        (restaurant.mode === "provider" ? "places_api" : null),
    })
    .select("id, name")
    .single();

  if (createError || !created) {
    return { error: createError?.message ?? "Could not create restaurant." };
  }

  return { restaurantId: created.id, restaurantName: created.name };
}

function confidenceForLocation(source: LocationSource): Confidence {
  if (source === "exif") return "high";
  if (source === "device") return "medium";
  if (source === "manual") return "low";
  return "unknown";
}

function summarizeDishVotes(
  dishes: Array<{
    name: string;
    is_recommended?: boolean;
    is_bad?: boolean;
  }>,
  mode: "recommended" | "bad",
) {
  const selected = dishes
    .filter((dish) =>
      mode === "recommended" ? dish.is_recommended : dish.is_bad,
    )
    .map((dish) => dish.name.trim())
    .filter(Boolean);

  return selected.length > 0 ? selected.join(", ") : null;
}

function deriveCuisineTypeFromDishes(
  dishes: Array<{ cuisine_guess?: string | null }>,
) {
  const counts = new Map<string, number>();

  dishes.forEach((dish) => {
    const cuisine = dish.cuisine_guess?.trim();
    if (!cuisine) return;
    counts.set(cuisine, (counts.get(cuisine) ?? 0) + 1);
  });

  let winner: string | null = null;
  let best = 0;
  counts.forEach((count, cuisine) => {
    if (count > best) {
      best = count;
      winner = cuisine;
    }
  });

  return winner;
}
