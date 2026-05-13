import type { SupabaseClient } from "@supabase/supabase-js";
import type { Restaurant, RestaurantAlias } from "@/lib/types";
import {
  buildRestaurantMatchCandidates,
  normalizeRestaurantName,
} from "@/server/restaurantIdentity";

type RestaurantMatchQuery = {
  name: string;
  city?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  provider_place_id?: string | null;
};

export async function searchRestaurantMatchCandidates({
  supabase,
  userId,
  query,
}: {
  supabase: SupabaseClient;
  userId: string;
  query: RestaurantMatchQuery;
}) {
  const [{ data: restaurants }, aliasResult] = await Promise.all([
    supabase.from("restaurants").select("*").eq("user_id", userId),
    supabase.from("restaurant_aliases").select("*").eq("user_id", userId),
  ]);

  const aliases = aliasResult.error
    ? []
    : ((aliasResult.data as RestaurantAlias[] | null) ?? []);
  const aliasesByRestaurant = groupAliasesByRestaurant(aliases);

  return buildRestaurantMatchCandidates({
    query,
    restaurants: ((restaurants as Restaurant[] | null) ?? []).map((restaurant) => ({
      ...restaurant,
      aliases: aliasesByRestaurant.get(restaurant.id) ?? [],
    })),
  });
}

export async function upsertRestaurantAlias({
  supabase,
  userId,
  restaurantId,
  aliasName,
  canonicalName,
  source,
}: {
  supabase: SupabaseClient;
  userId: string;
  restaurantId: string;
  aliasName?: string | null;
  canonicalName?: string | null;
  source: "user_input" | "ai" | "places_api";
}) {
  const trimmedAlias = aliasName?.trim();
  if (!trimmedAlias) return;

  const normalizedAlias = normalizeRestaurantName(trimmedAlias);
  const normalizedCanonical = normalizeRestaurantName(canonicalName);

  if (!normalizedAlias || normalizedAlias === normalizedCanonical) {
    return;
  }

  await supabase.from("restaurant_aliases").upsert(
    {
      user_id: userId,
      restaurant_id: restaurantId,
      alias_name: trimmedAlias,
      normalized_alias_name: normalizedAlias,
      source,
    },
    {
      onConflict: "user_id,restaurant_id,normalized_alias_name",
      ignoreDuplicates: false,
    },
  );
}

function groupAliasesByRestaurant(aliases: RestaurantAlias[]) {
  const map = new Map<string, RestaurantAlias[]>();

  aliases.forEach((alias) => {
    const items = map.get(alias.restaurant_id) ?? [];
    items.push(alias);
    map.set(alias.restaurant_id, items);
  });

  return map;
}
