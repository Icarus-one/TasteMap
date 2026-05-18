import type { SupabaseClient } from "@supabase/supabase-js";

export async function exportUserArchive({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}) {
  const [
    restaurants,
    restaurantAliases,
    visits,
    dishes,
    photos,
    placeCandidates,
    toEatItems,
    analyticsEvents,
  ] = await Promise.all([
    supabase.from("restaurants").select("*").eq("user_id", userId),
    supabase.from("restaurant_aliases").select("*").eq("user_id", userId),
    supabase.from("visits").select("*").eq("user_id", userId),
    supabase.from("dishes").select("*").eq("user_id", userId),
    supabase.from("photos").select("*").eq("user_id", userId),
    supabase.from("place_candidates").select("*").eq("user_id", userId),
    supabase.from("to_eat_items").select("*").eq("user_id", userId),
    supabase.from("analytics_events").select("*").eq("user_id", userId),
  ]);

  return {
    exported_at: new Date().toISOString(),
    user_id: userId,
    restaurants: restaurants.data ?? [],
    restaurant_aliases: restaurantAliases.data ?? [],
    visits: visits.data ?? [],
    dishes: dishes.data ?? [],
    photos: photos.data ?? [],
    place_candidates: placeCandidates.data ?? [],
    to_eat_items: toEatItems.data ?? [],
    analytics_events: analyticsEvents.data ?? [],
  };
}

export async function deleteUserArchive({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}) {
  const { data: photos } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("user_id", userId);

  const paths = (photos ?? [])
    .map((photo) => photo.storage_path)
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    await supabase.storage.from("food-photos").remove(paths);
  }

  await supabase.from("to_eat_items").delete().eq("user_id", userId);
  await supabase.from("place_candidates").delete().eq("user_id", userId);
  await supabase.from("restaurant_aliases").delete().eq("user_id", userId);
  await supabase.from("photos").delete().eq("user_id", userId);
  await supabase.from("dishes").delete().eq("user_id", userId);
  await supabase.from("visits").delete().eq("user_id", userId);
  await supabase.from("restaurants").delete().eq("user_id", userId);
  await supabase.from("analytics_events").delete().eq("user_id", userId);

  return { ok: true as const };
}
