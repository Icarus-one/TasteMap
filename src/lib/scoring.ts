import type { RestaurantWithRelations, Visit } from "@/lib/types";

type ScoredVisitFields = Pick<
  Visit,
  "created_at" | "taken_at" | "total_score" | "visit_date"
>;

export function getWeightedRestaurantScore(
  restaurant: Pick<RestaurantWithRelations, "visits">,
) {
  return getWeightedVisitScore(restaurant.visits ?? []);
}

export function getWeightedVisitScore(visits: ScoredVisitFields[]) {
  const scoredVisits = visits
    .filter((visit) => typeof visit.total_score === "number")
    .sort((left, right) => getVisitTime(left) - getVisitTime(right));

  if (scoredVisits.length === 0) return null;

  const { weightedSum, totalWeight } = scoredVisits.reduce(
    (accumulator, visit, index) => {
      const weight = index + 1;
      return {
        weightedSum: accumulator.weightedSum + Number(visit.total_score) * weight,
        totalWeight: accumulator.totalWeight + weight,
      };
    },
    { weightedSum: 0, totalWeight: 0 },
  );

  return weightedSum / totalWeight;
}

function getVisitTime(visit: ScoredVisitFields) {
  const rawDate = visit.visit_date ?? visit.taken_at ?? visit.created_at;
  const timestamp = new Date(rawDate).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}
