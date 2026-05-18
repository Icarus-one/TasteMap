/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Coins, MapPin, Sparkles } from "lucide-react";
import { compactAddress, formatAveragePrice, formatDate } from "@/lib/format";
import { buildGoogleMapsSearchUrl } from "@/lib/maps";
import { getWeightedRestaurantScore } from "@/lib/scoring";
import type { RestaurantWithRelations } from "@/lib/types";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { UserText } from "@/components/i18n/UserText";

type RestaurantCardProps = {
  restaurant: RestaurantWithRelations;
};

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const latestVisit = [...(restaurant.visits ?? [])].sort((a, b) =>
    String(b.created_at).localeCompare(String(a.created_at)),
  )[0];
  const weightedScore = getWeightedRestaurantScore(restaurant);
  const heroPhoto = restaurant.photos?.[0] ?? latestVisit?.photos?.[0];
  const recommended = (restaurant.dishes ?? [])
    .filter((dish) => dish.is_recommended)
    .map((dish) => dish.name)
    .slice(0, 3);
  const notRecommended = (restaurant.dishes ?? [])
    .filter((dish) => dish.is_bad)
    .map((dish) => dish.name)
    .slice(0, 3);
  const tags = buildRestaurantTags(restaurant);
  const locationLabel = compactAddress(
    restaurant.city,
    restaurant.address,
    restaurant.latitude,
    restaurant.longitude,
  );
  const mapsUrl = buildGoogleMapsSearchUrl(restaurant);

  return (
    <article className="group relative grid overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md">
      <Link
        href={`/restaurants/${restaurant.id}`}
        aria-label={`Open ${restaurant.name}`}
        className="absolute inset-0 z-0"
      />
      <div className="pointer-events-none relative z-10 aspect-[16/9] bg-stone-100">
        {heroPhoto?.display_url || heroPhoto?.public_url ? (
          <img
            src={heroPhoto.display_url ?? heroPhoto.public_url ?? ""}
            alt={restaurant.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-400">
            <Sparkles aria-hidden="true" className="size-8" />
          </div>
        )}
      </div>
      <div className="pointer-events-none relative z-10 grid gap-4 p-4">
        <div className="grid gap-1">
          <div className="flex items-start justify-between gap-3">
            <UserText
              as="h2"
              text={restaurant.name}
              className="text-lg font-bold text-stone-950"
            />
            <ScoreBadge score={weightedScore} label="Stars" />
          </div>
          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="pointer-events-auto relative z-20 flex w-fit items-center gap-1 rounded-lg text-sm font-semibold text-stone-600 underline-offset-4 transition hover:text-emerald-700 hover:underline"
              aria-label={`Open ${restaurant.name} in Google Maps`}
              title="Open in Google Maps"
            >
              <MapPin aria-hidden="true" className="size-4" />
              <span className="line-clamp-1">{locationLabel}</span>
            </a>
          ) : null}
          {latestVisit ? (
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-wide text-stone-400">
              <span>
                Latest log {formatDate(latestVisit.visit_date ?? latestVisit.taken_at)}
              </span>
              {latestVisit.average_price !== null &&
              latestVisit.average_price !== undefined ? (
                <span className="inline-flex items-center gap-1">
                  <Coins aria-hidden="true" className="size-3.5" />
                  {formatAveragePrice(
                    latestVisit.average_price,
                    restaurant.currency ?? "GBP",
                  )}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-sm font-medium text-amber-900"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        {latestVisit?.summary ? (
          <UserText
            as="p"
            text={latestVisit.summary}
            className="line-clamp-2 text-sm leading-6 text-stone-600"
            translationClassName="line-clamp-2 text-xs leading-5 text-stone-500"
          />
        ) : null}
        {recommended.length > 0 ? (
          <p className="text-sm text-stone-600">
            <span className="font-semibold text-emerald-800">Recommend:</span>{" "}
            {recommended.join(", ")}
          </p>
        ) : null}
        {notRecommended.length > 0 ? (
          <p className="text-sm text-stone-600">
            <span className="font-semibold text-rose-700">Skip:</span>{" "}
            {notRecommended.join(", ")}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function buildRestaurantTags(restaurant: RestaurantWithRelations) {
  const latestVisit = [...(restaurant.visits ?? [])].sort((a, b) =>
    String(b.created_at).localeCompare(String(a.created_at)),
  )[0];
  const values = [
    ...(latestVisit?.suitable_scenarios ?? []),
    restaurant.cuisine_type,
    ...(restaurant.dishes ?? []).map((dish) => dish.cuisine_guess),
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim());

  return Array.from(new Set(values)).slice(0, 4);
}
