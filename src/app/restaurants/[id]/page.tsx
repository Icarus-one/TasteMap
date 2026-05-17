/* eslint-disable @next/next/no-img-element */

import { notFound } from "next/navigation";
import {
  Check,
  CalendarDays,
  Circle,
  MapPin,
  X,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { PhotoGallery } from "@/components/detail/PhotoGallery";
import { RestaurantCardActionsMenu } from "@/components/detail/RestaurantCardActionsMenu";
import { ShareActionButton } from "@/components/share/ShareActionButton";
import { AddRestaurantToListButton } from "@/components/social/AddRestaurantToListButton";
import { SendRestaurantToFriendButton } from "@/components/social/SendRestaurantToFriendButton";
import { UserText } from "@/components/i18n/UserText";
import { VisitCard } from "@/components/cards/VisitCard";
import { RestaurantLocationMap } from "@/components/map/RestaurantLocationMap";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { compactAddress, formatDate } from "@/lib/format";
import { getRestaurantById } from "@/lib/data";
import { getWeightedRestaurantScore } from "@/lib/scoring";
import { buildRestaurantShareText } from "@/lib/share";
import type { Photo, RestaurantWithRelations } from "@/lib/types";

type RestaurantPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function RestaurantPage({ params }: RestaurantPageProps) {
  const { id } = await params;
  const restaurant = await getRestaurantById(id);

  if (!restaurant) notFound();

  const visits = [...(restaurant.visits ?? [])].sort((a, b) =>
    String(b.created_at).localeCompare(String(a.created_at)),
  );
  const latestVisit = visits[0];
  const recommended = (restaurant.dishes ?? []).filter((dish) => dish.is_recommended);
  const neutral = (restaurant.dishes ?? []).filter(
    (dish) => !dish.is_recommended && !dish.is_bad,
  );
  const bad = (restaurant.dishes ?? []).filter((dish) => dish.is_bad);
  const galleryPhotos = collectRestaurantPhotos(restaurant);
  const dishPhotoIndex = buildDishPhotoIndex(restaurant, galleryPhotos);
  const tags = collectRestaurantTags(restaurant);
  const shareText = buildRestaurantShareText(restaurant);
  const weightedScore = getWeightedRestaurantScore(restaurant);

  return (
    <main className="min-h-screen bg-stone-50">
      <AppHeader
        actions={
          <RestaurantCardActionsMenu
            restaurant={{
              id: restaurant.id,
              name: restaurant.name,
              city: restaurant.city,
              address: restaurant.address,
            }}
          />
        }
      />
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-6 sm:px-6 sm:py-8">
        <section className="grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-900"
                  >
                    {tag}
                  </span>
                ))}
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-800">
                  Private restaurant
                </span>
              </div>
              <div className="grid gap-2">
                <UserText
                  as="h1"
                  text={restaurant.name}
                  className="text-3xl font-bold text-stone-950 sm:text-4xl"
                  translationClassName="text-sm leading-6 text-stone-500"
                />
                <p className="flex items-center gap-2 text-sm text-stone-500">
                  <MapPin aria-hidden="true" className="size-4" />
                  {compactAddress(restaurant.city, restaurant.address)}
                </p>
              </div>
              {latestVisit?.summary ? (
                <UserText
                  as="p"
                  text={latestVisit.summary}
                  className="max-w-3xl text-base leading-7 text-stone-700"
                  translationClassName="max-w-3xl text-sm leading-6 text-stone-500"
                />
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <AddRestaurantToListButton
                restaurantId={restaurant.id}
                restaurantName={restaurant.name}
              />
              <SendRestaurantToFriendButton
                restaurantId={restaurant.id}
                restaurantName={restaurant.name}
              />
              <ShareActionButton
                title={restaurant.name}
                text={shareText}
                shareEndpoint={`/api/share/restaurants/${restaurant.id}`}
                label="Share"
              />
              <ScoreBadge
                score={weightedScore}
                label="Stars"
              />
              <span className="inline-flex items-center rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-sm font-semibold text-stone-700">
                {visits.length} log{visits.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-bold text-stone-950">Photo wall</h2>
          <PhotoGallery photos={galleryPhotos} />
        </section>

        <RestaurantLocationMap
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? null}
          name={restaurant.name}
          address={compactAddress(restaurant.city, restaurant.address)}
          latitude={restaurant.latitude}
          longitude={restaurant.longitude}
        />

        <section className="grid gap-4 md:grid-cols-3">
          <DishList
            icon="recommended"
            empty="No recommended dishes marked yet."
            items={recommended.map((dish) => ({
              name: dish.name,
              photo: dishPhotoIndex.get(normalizeDishName(dish.name)) ?? null,
            }))}
          />
          <DishList
            icon="neutral"
            empty="No neutral dishes marked yet."
            items={neutral.map((dish) => ({
              name: dish.name,
              photo: dishPhotoIndex.get(normalizeDishName(dish.name)) ?? null,
            }))}
          />
          <DishList
            icon="bad"
            empty="No bad dishes marked yet."
            items={bad.map((dish) => ({
              name: dish.name,
              photo: dishPhotoIndex.get(normalizeDishName(dish.name)) ?? null,
            }))}
          />
        </section>

        <section className="grid gap-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-stone-950">Visit history</h2>
              <p className="text-sm text-stone-500">
                {visits.length} logged meal{visits.length === 1 ? "" : "s"} here.
              </p>
            </div>
          </div>
          {visits.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {visits.map((visit) => (
                <VisitCard key={visit.id} visit={{ ...visit, restaurants: restaurant }} />
              ))}
            </div>
          ) : (
            <EmptyState label="No visits saved for this restaurant yet." />
          )}
        </section>

        {visits.length > 0 ? (
          <section className="grid gap-4">
            <h2 className="text-xl font-bold text-stone-950">Star trend</h2>
            <div className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
              {visits.map((visit) => (
                <div
                  key={visit.id}
                  className="grid gap-2 sm:grid-cols-[8rem_1fr_auto] sm:items-center"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-stone-600">
                    <CalendarDays aria-hidden="true" className="size-4" />
                    {formatDate(visit.visit_date ?? visit.taken_at)}
                  </span>
                  <span className="h-2 overflow-hidden rounded-full bg-stone-100">
                    <span
                      className="block h-full rounded-full bg-emerald-600"
                      style={{
                        width: `${scoreBarWidth(visit.total_score)}%`,
                      }}
                    />
                  </span>
                  <ScoreBadge score={visit.total_score} label="Stars" />
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function DishList({
  items,
  empty,
  icon,
}: {
  items: Array<{ name: string; photo: Photo | null }>;
  empty: string;
  icon: "recommended" | "neutral" | "bad";
}) {
  const Icon =
    icon === "recommended" ? Check : icon === "neutral" ? Circle : X;
  const tone =
    icon === "recommended"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : icon === "neutral"
        ? "border-stone-200 bg-stone-50 text-stone-600"
        : "border-rose-200 bg-rose-50 text-rose-700";
  const srLabel =
    icon === "recommended"
      ? "Worth ordering"
      : icon === "neutral"
        ? "Neither good nor bad"
        : "Skip next time";
  return (
    <section className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold text-stone-950">
        <span
          className={`inline-flex size-8 items-center justify-center rounded-lg border ${tone}`}
        >
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <span className="sr-only">{srLabel}</span>
      </h2>
      {items.length > 0 ? (
        <div className="grid gap-2">
          {items.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-3 rounded-lg border border-stone-200 px-2.5 py-2 text-sm font-medium text-stone-700"
            >
              {item.photo?.display_url || item.photo?.public_url ? (
                <img
                  src={item.photo.display_url ?? item.photo.public_url ?? ""}
                  alt={item.name}
                  className="size-12 rounded-md object-cover"
                />
              ) : (
                <div className="size-12 rounded-md bg-stone-100" />
              )}
              <UserText
                as="span"
                text={item.name}
                translationAs="span"
                translationClassName="block text-xs leading-5 text-stone-500"
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-500">{empty}</p>
      )}
    </section>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
      {label}
    </div>
  );
}

function collectRestaurantPhotos(restaurant: RestaurantWithRelations): Photo[] {
  const map = new Map<string, Photo>();
  (restaurant.photos ?? []).forEach((photo) => map.set(photo.id, photo));
  (restaurant.visits ?? []).forEach((visit) => {
    (visit.photos ?? []).forEach((photo) => map.set(photo.id, photo));
  });
  return Array.from(map.values());
}

function buildDishPhotoIndex(
  restaurant: RestaurantWithRelations,
  galleryPhotos: Photo[],
) {
  const index = new Map<string, Photo>();
  const visitDishIds = new Map<string, string>();

  (restaurant.visits ?? []).forEach((visit) => {
    (visit.dishes ?? []).forEach((dish) => {
      visitDishIds.set(dish.id, dish.name);
    });
  });

  galleryPhotos.forEach((photo) => {
    const visible = photo.display_url || photo.public_url;
    if (!visible) return;

    const linkedDishName = photo.dish_id ? visitDishIds.get(photo.dish_id) : null;
    if (linkedDishName) {
      setDishPhoto(index, linkedDishName, photo);
    }

    extractDetectedDishNames(photo.ai_detected_dishes).forEach((name) => {
      setDishPhoto(index, name, photo);
    });
  });

  return index;
}

function setDishPhoto(index: Map<string, Photo>, dishName: string, photo: Photo) {
  const key = normalizeDishName(dishName);
  if (!key || index.has(key)) return;
  index.set(key, photo);
}

function extractDetectedDishNames(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      if ("name" in item && typeof item.name === "string") {
        return item.name;
      }

      if ("nameGuess" in item && typeof item.nameGuess === "string") {
        return item.nameGuess;
      }

      if ("name_guess" in item && typeof item.name_guess === "string") {
        return item.name_guess;
      }

      return null;
    })
    .filter((item): item is string => Boolean(item?.trim()));
}

function normalizeDishName(value: string) {
  return value.trim().toLowerCase();
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

  return Array.from(new Set(values)).slice(0, 4);
}

function scoreBarWidth(score: number | null) {
  if (typeof score !== "number") return 4;
  return Math.max(8, Math.min(100, score * 20));
}
