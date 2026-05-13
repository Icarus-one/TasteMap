import { compactAddress, formatAveragePrice, formatDate, formatScore } from "@/lib/format";
import type {
  RestaurantWithRelations,
  ToEatItem,
  VisitWithRelations,
} from "@/lib/types";

export function buildRestaurantShareText(restaurant: RestaurantWithRelations) {
  const visits = [...(restaurant.visits ?? [])].sort((a, b) =>
    String(b.created_at).localeCompare(String(a.created_at)),
  );
  const latestVisit = visits[0];
  const tags = collectRestaurantTags(restaurant).slice(0, 4);
  const recommended = (restaurant.dishes ?? [])
    .filter((dish) => dish.is_recommended)
    .map((dish) => dish.name)
    .slice(0, 3);
  const skipped = (restaurant.dishes ?? [])
    .filter((dish) => dish.is_bad)
    .map((dish) => dish.name)
    .slice(0, 2);

  return [
    restaurant.name,
    compactAddress(restaurant.city, restaurant.address),
    latestVisit?.total_score !== null && latestVisit?.total_score !== undefined
      ? `Stars: ${formatScore(latestVisit.total_score)}/5`
      : null,
    tags.length > 0 ? `Tags: ${tags.join(", ")}` : null,
    recommended.length > 0 ? `Worth ordering: ${recommended.join(", ")}` : null,
    skipped.length > 0 ? `Skip next time: ${skipped.join(", ")}` : null,
    latestVisit?.summary ?? null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildVisitShareText(visit: VisitWithRelations) {
  const dishes = (visit.dishes ?? []).map((dish) => dish.name).slice(0, 5);
  const recommended = (visit.dishes ?? [])
    .filter((dish) => dish.is_recommended)
    .map((dish) => dish.name)
    .slice(0, 3);
  const skipped = (visit.dishes ?? [])
    .filter((dish) => dish.is_bad)
    .map((dish) => dish.name)
    .slice(0, 2);

  return [
    `${visit.restaurants?.name ?? "Restaurant log"} · ${formatDate(
      visit.visit_date ?? visit.taken_at,
    )}`,
    visit.total_score !== null && visit.total_score !== undefined
      ? `Stars: ${formatScore(visit.total_score)}/5`
      : null,
    visit.average_price !== null && visit.average_price !== undefined
      ? `Per person: ${formatAveragePrice(
          visit.average_price,
          visit.restaurants?.currency ?? "GBP",
        )}`
      : null,
    dishes.length > 0 ? `Dishes: ${dishes.join(", ")}` : null,
    recommended.length > 0 ? `Worth ordering: ${recommended.join(", ")}` : null,
    skipped.length > 0 ? `Skip next time: ${skipped.join(", ")}` : null,
    visit.summary ?? visit.detailed_review ?? null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildToDoShareText(item: ToEatItem) {
  return [
    item.title,
    [item.restaurant_name, item.city, item.cuisine_type]
      .filter(Boolean)
      .join(" · ") || null,
    item.tags && item.tags.length > 0 ? `Tags: ${item.tags.join(", ")}` : null,
    item.note ?? null,
    item.source_url ? `Source: ${item.source_url}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function collectRestaurantTags(restaurant: RestaurantWithRelations) {
  const latestVisit = [...(restaurant.visits ?? [])].sort((a, b) =>
    String(b.created_at).localeCompare(String(a.created_at)),
  )[0];

  return Array.from(
    new Set(
      [
        ...(latestVisit?.suitable_scenarios ?? []),
        restaurant.cuisine_type,
        ...(restaurant.dishes ?? []).map((dish) => dish.cuisine_guess),
      ]
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => value.trim()),
    ),
  );
}
