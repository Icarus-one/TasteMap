/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { CalendarDays, Coins, ThumbsDown, ThumbsUp, Utensils } from "lucide-react";
import { formatAveragePrice, formatDate } from "@/lib/format";
import type { VisitWithRelations } from "@/lib/types";
import { ScoreBadge } from "@/components/ui/ScoreBadge";

type VisitCardProps = {
  visit: VisitWithRelations;
};

export function VisitCard({ visit }: VisitCardProps) {
  const dishes = visit.dishes?.map((dish) => dish.name).slice(0, 4) ?? [];
  const heroPhoto = visit.photos?.[0];
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
    <Link
      href={`/visits/${visit.id}`}
      className="grid overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md"
    >
      {heroPhoto?.display_url || heroPhoto?.public_url ? (
        <img
          src={heroPhoto.display_url ?? heroPhoto.public_url ?? ""}
          alt={visit.restaurants?.name ?? "Visit photo"}
          className="aspect-[16/9] h-full w-full object-cover"
        />
      ) : null}
      <div className="grid gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <h3 className="font-bold text-stone-950">
              {visit.restaurants?.name ?? "Unknown restaurant"}
            </h3>
            <p className="flex items-center gap-1 text-sm text-stone-500">
              <CalendarDays aria-hidden="true" className="size-4" />
              {formatDate(visit.visit_date ?? visit.taken_at)}
            </p>
            {visit.average_price !== null && visit.average_price !== undefined ? (
              <p className="flex items-center gap-1 text-sm text-stone-500">
                <Coins aria-hidden="true" className="size-4" />
                {formatAveragePrice(
                  visit.average_price,
                  visit.restaurants?.currency ?? "GBP",
                )}
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
          <p className="line-clamp-2 text-sm leading-6 text-stone-600">
            {visit.summary}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
