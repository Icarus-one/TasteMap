/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  CalendarDays,
  Coins,
  MapPin,
  ThumbsDown,
  ThumbsUp,
  Users,
  Utensils,
} from "lucide-react";
import { compactAddress, formatAveragePrice, formatDate } from "@/lib/format";
import { buildGoogleMapsSearchUrl } from "@/lib/maps";
import type { VisitWithRelations } from "@/lib/types";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { UserText } from "@/components/i18n/UserText";

type VisitCardProps = {
  visit: VisitWithRelations;
};

export function VisitCard({ visit }: VisitCardProps) {
  const restaurant = visit.restaurants;
  const dishes = visit.dishes?.map((dish) => dish.name).slice(0, 4) ?? [];
  const heroPhoto = visit.photos?.[0];
  const locationLabel = compactAddress(
    restaurant?.city ?? null,
    restaurant?.address ?? null,
    restaurant?.latitude ?? null,
    restaurant?.longitude ?? null,
  );
  const mapsUrl = buildGoogleMapsSearchUrl({
    name: restaurant?.name,
    city: restaurant?.city,
    address: restaurant?.address,
    latitude: restaurant?.latitude,
    longitude: restaurant?.longitude,
  });
  const recommended = visit.dishes
    ?.filter((dish) => dish.is_recommended)
    .map((dish) => dish.name)
    .slice(0, 2);
  const notRecommended = visit.dishes
    ?.filter((dish) => dish.is_bad)
    .map((dish) => dish.name)
    .slice(0, 2);
  const tags = Array.from(
    new Set(
      [
        ...(visit.suitable_scenarios ?? []),
        visit.restaurants?.cuisine_type,
        ...((visit.dishes ?? []).map((dish) => dish.cuisine_guess)),
      ]
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => value.trim()),
    ),
  ).slice(0, 3);

  return (
    <article className="group relative grid overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md">
      <Link
        href={`/visits/${visit.id}`}
        aria-label={`Open ${restaurant?.name ?? "visit"} log`}
        className="absolute inset-0 z-0"
      />
      {heroPhoto?.display_url || heroPhoto?.public_url ? (
        <img
          src={heroPhoto.display_url ?? heroPhoto.public_url ?? ""}
          alt={restaurant?.name ?? "Visit photo"}
          className="pointer-events-none relative z-10 aspect-[16/9] h-full w-full object-cover"
        />
      ) : null}
      <div className="pointer-events-none relative z-10 grid gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <UserText
              as="h3"
              text={restaurant?.name ?? "Unknown restaurant"}
              className="font-bold text-stone-950"
            />
            <p className="flex items-center gap-1 text-sm text-stone-500">
              <CalendarDays aria-hidden="true" className="size-4" />
              {formatDate(visit.visit_date ?? visit.taken_at)}
            </p>
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="pointer-events-auto relative z-20 flex w-fit items-center gap-1 rounded-lg text-sm font-semibold text-stone-600 underline-offset-4 transition hover:text-emerald-700 hover:underline"
                aria-label={`Open ${restaurant?.name ?? "this restaurant"} in Google Maps`}
                title="Open in Google Maps"
              >
                <MapPin aria-hidden="true" className="size-4" />
                <span className="line-clamp-1">{locationLabel}</span>
              </a>
            ) : null}
            {visit.average_price !== null && visit.average_price !== undefined ? (
              <p className="flex items-center gap-1 text-sm text-stone-500">
                <Coins aria-hidden="true" className="size-4" />
                {formatAveragePrice(
                  visit.average_price,
                  restaurant?.currency ?? "GBP",
                )}
              </p>
            ) : null}
            {visit.companions ? (
              <p className="flex items-center gap-1 text-sm text-stone-500">
                <Users aria-hidden="true" className="size-4" />
                <span className="line-clamp-1">{visit.companions}</span>
              </p>
            ) : null}
          </div>
          <ScoreBadge score={visit.total_score} label="Stars" />
        </div>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-sm font-medium text-stone-700"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        {dishes.length > 0 ? (
          <p className="flex items-center gap-2 text-sm text-stone-600">
            <Utensils aria-hidden="true" className="size-4 shrink-0" />
            <span className="line-clamp-1">{dishes.join(", ")}</span>
          </p>
        ) : null}
        {recommended?.length ? (
          <p className="flex items-center gap-2 text-sm text-emerald-700">
            <ThumbsUp aria-hidden="true" className="size-4 shrink-0" />
            <span className="line-clamp-1">{recommended.join(", ")}</span>
          </p>
        ) : null}
        {notRecommended?.length ? (
          <p className="flex items-center gap-2 text-sm text-rose-700">
            <ThumbsDown aria-hidden="true" className="size-4 shrink-0" />
            <span className="line-clamp-1">{notRecommended.join(", ")}</span>
          </p>
        ) : null}
        {visit.summary ? (
          <UserText
            as="p"
            text={visit.summary}
            className="line-clamp-2 text-sm leading-6 text-stone-600"
            translationClassName="line-clamp-2 text-xs leading-5 text-stone-500"
          />
        ) : null}
      </div>
    </article>
  );
}
