/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Check, MapPin, X } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { I18nText } from "@/components/i18n/I18nText";
import { UserText } from "@/components/i18n/UserText";
import { AddSharedRestaurantToDoButton } from "@/components/share/AddSharedRestaurantToDoButton";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { compactAddress, formatDate } from "@/lib/format";
import { getSessionContext } from "@/lib/data";
import { profileInitial } from "@/lib/profileUtils";
import { getSharedRestaurantByToken } from "@/lib/sharedRestaurants";
import type { Photo, RestaurantWithRelations } from "@/lib/types";

type SharedRestaurantPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function SharedRestaurantPage({
  params,
}: SharedRestaurantPageProps) {
  const { id: token } = await params;
  const [shared, context] = await Promise.all([
    getSharedRestaurantByToken(token),
    getSessionContext(),
  ]);

  if (!shared) notFound();

  const { restaurant, sharer } = shared;
  const sharePath = `/share/restaurants/${token}`;
  const visits = [...(restaurant.visits ?? [])].sort((a, b) =>
    String(b.created_at).localeCompare(String(a.created_at)),
  );
  const latestVisit = visits[0];
  const tags = collectRestaurantTags(restaurant);
  const recommended = (restaurant.dishes ?? [])
    .filter((dish) => dish.is_recommended)
    .slice(0, 5);
  const skipped = (restaurant.dishes ?? []).filter((dish) => dish.is_bad).slice(0, 3);
  const photos = collectRestaurantPhotos(restaurant).slice(0, 6);
  const note = [
    latestVisit?.summary,
    recommended.length > 0
      ? `Recommended: ${recommended.map((dish) => dish.name).join(", ")}`
      : null,
    skipped.length > 0
      ? `Skip next time: ${skipped.map((dish) => dish.name).join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 500);

  return (
    <main className="min-h-screen bg-stone-50">
      <AppHeader showAuthActions={false} />
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
            <div className="grid gap-3">
              <p className="text-sm font-bold uppercase text-emerald-700">
                <I18nText k="share.eyebrow" />
              </p>
              {sharer ? (
                <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
                  {sharer.avatar_url ? (
                    <img
                      src={sharer.avatar_url}
                      alt=""
                      className="size-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="grid size-11 place-items-center rounded-full bg-stone-950 text-sm font-bold text-white">
                      {profileInitial(sharer)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase text-stone-500">
                      <I18nText k="share.sharedBy" />
                    </p>
                    <p className="truncate text-sm font-bold text-stone-950">
                      {sharer.display_name}
                    </p>
                    {sharer.handle ? (
                      <p className="truncate text-xs font-semibold text-stone-500">
                        @{sharer.handle}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <UserText
                as="h1"
                text={restaurant.name}
                className="text-3xl font-bold text-stone-950 sm:text-4xl"
                translationClassName="text-sm leading-6 text-stone-500"
              />
              <p className="flex items-center gap-2 text-sm text-stone-500">
                <MapPin aria-hidden="true" className="size-4" />
                {compactAddress(
                  restaurant.city,
                  restaurant.address,
                  restaurant.latitude,
                  restaurant.longitude,
                )}
              </p>
              {latestVisit?.summary ? (
                <UserText
                  as="p"
                  text={latestVisit.summary}
                  className="max-w-3xl text-base leading-7 text-stone-700"
                  translationClassName="max-w-3xl text-sm leading-6 text-stone-500"
                />
              ) : null}
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-900"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="grid gap-3 md:min-w-56">
              <ScoreBadge score={latestVisit?.total_score ?? null} label="Stars" />
              {context.user ? (
                <AddSharedRestaurantToDoButton
                  restaurant={{
                    name: restaurant.name,
                    city: restaurant.city,
                    address: restaurant.address,
                    cuisine_type: restaurant.cuisine_type,
                  }}
                  note={note || null}
                  tags={tags}
                />
              ) : (
                <div className="grid gap-2">
                  <Link
                    href={`/signup?next=${encodeURIComponent(sharePath)}`}
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-stone-950 px-4 text-sm font-bold text-white transition hover:bg-stone-800"
                  >
                    <I18nText k="share.createToSave" />
                  </Link>
                  <Link
                    href={`/login?next=${encodeURIComponent(sharePath)}`}
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-800 transition hover:border-stone-300"
                  >
                    <I18nText k="share.signIn" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {photos.length > 0 ? (
          <section className="grid gap-3">
            <h2 className="text-xl font-bold text-stone-950">
              <I18nText k="share.photos" />
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.display_url ?? photo.public_url ?? ""}
                  alt={photo.caption ?? restaurant.name}
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          <DishPanel
            titleKey="share.worthOrdering"
            tone="emerald"
            icon="check"
            items={recommended.map((dish) => dish.name)}
          />
          <DishPanel
            titleKey="share.skipNextTime"
            tone="rose"
            icon="x"
            items={skipped.map((dish) => dish.name)}
          />
        </section>

        {latestVisit ? (
          <section className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="text-xl font-bold text-stone-950">
              <I18nText k="share.latestVisit" />
            </h2>
            <p className="flex items-center gap-2 text-sm font-medium text-stone-600">
              <CalendarDays aria-hidden="true" className="size-4" />
              {formatDate(latestVisit.visit_date ?? latestVisit.taken_at)}
            </p>
            {latestVisit.detailed_review ? (
              <UserText
                as="p"
                text={latestVisit.detailed_review}
                className="text-sm leading-6 text-stone-700"
              />
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}

function DishPanel({
  titleKey,
  tone,
  icon,
  items,
}: {
  titleKey: "share.worthOrdering" | "share.skipNextTime";
  tone: "emerald" | "rose";
  icon: "check" | "x";
  items: string[];
}) {
  const Icon = icon === "check" ? Check : X;
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <section className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold text-stone-950">
        <span
          className={`inline-flex size-8 items-center justify-center rounded-lg border ${toneClass}`}
        >
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <I18nText k={titleKey} />
      </h2>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-sm font-semibold text-stone-700"
            >
              <UserText
                text={item}
                translationAs="span"
                translationClassName="block text-xs leading-5 text-stone-500"
              />
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-500">
          <I18nText k="share.noDishes" />
        </p>
      )}
    </section>
  );
}

function collectRestaurantTags(restaurant: RestaurantWithRelations) {
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

  return Array.from(new Set(values)).slice(0, 8);
}

function collectRestaurantPhotos(restaurant: RestaurantWithRelations): Photo[] {
  const map = new Map<string, Photo>();
  (restaurant.photos ?? []).forEach((photo) => {
    if (photo.display_url || photo.public_url) map.set(photo.id, photo);
  });
  (restaurant.visits ?? []).forEach((visit) => {
    (visit.photos ?? []).forEach((photo) => {
      if (photo.display_url || photo.public_url) map.set(photo.id, photo);
    });
  });
  return Array.from(map.values());
}
