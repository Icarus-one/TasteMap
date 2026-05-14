"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { type ReactNode } from "react";
import {
  ArrowRight,
  ClipboardList,
  Clock3,
  MapPin,
  MapPinned,
  MoreHorizontal,
  Search,
  Settings,
  Sparkles,
  Star,
  Tags,
} from "lucide-react";
import { NewEntryMenu } from "@/components/layout/NewEntryMenu";
import { LanguageMenu } from "@/components/layout/LanguageMenu";
import { UserText } from "@/components/i18n/UserText";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { compactAddress } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import {
  getWeightedRestaurantScore,
  getWeightedVisitScore,
} from "@/lib/scoring";
import type {
  RestaurantWithRelations,
  Profile,
  ToEatItem,
  VisitWithRelations,
} from "@/lib/types";

type DashboardClientProps = {
  restaurants: RestaurantWithRelations[];
  toEatItems: ToEatItem[];
  visits: VisitWithRelations[];
  profile?: Profile | null;
};

export function DashboardClient({
  restaurants,
  toEatItems,
  visits,
  profile = null,
}: DashboardClientProps) {
  const { t } = useI18n();
  const archivePreview = [...restaurants]
    .sort((left, right) =>
      String(getLatestVisit(right)?.created_at ?? right.created_at).localeCompare(
        String(getLatestVisit(left)?.created_at ?? left.created_at),
      ),
    )
    .slice(0, 3);
  const toDoPreview = [...toEatItems]
    .filter((item) => item.status === "to_eat" || item.status === "booked")
    .sort((left, right) =>
      String(right.updated_at ?? right.created_at).localeCompare(
        String(left.updated_at ?? left.created_at),
      ),
    );
  const compactToDoPreview = toDoPreview.slice(0, 3);

  const averageScore = getWeightedVisitScore(visits);
  const totalRecommendedDishes = visits.reduce(
    (sum, visit) => sum + countRecommendedVotes(visit),
    0,
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8e8_0%,#fffdf8_16rem,#ffffff_36rem)]">
      <header className="border-b border-amber-100 bg-[#ffd469]/70 px-4 py-6 backdrop-blur sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-2">
              <ProfileMenu profile={profile} />
              <p className="text-sm font-bold uppercase tracking-wide text-stone-700">
                {t("dashboard.brand")}
              </p>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
                {t("dashboard.title")}
              </h1>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <LanguageMenu />
              <Link
                href="/map"
                className="inline-flex size-11 items-center justify-center rounded-lg border border-white/80 bg-white/90 text-stone-800 shadow-sm transition hover:bg-white"
                aria-label={t("header.map")}
                title={t("header.map")}
              >
                <MapPinned aria-hidden="true" className="size-5" />
              </Link>
              <Link
                href="/settings"
                className="inline-flex size-11 items-center justify-center rounded-lg border border-white/80 bg-white/90 text-stone-800 shadow-sm transition hover:bg-white"
                aria-label={t("header.settings")}
                title={t("header.settings")}
              >
                <Settings aria-hidden="true" className="size-5" />
              </Link>
              <NewEntryMenu variant="hero" />
            </div>
          </div>

          <Link
            href="/search"
            className="group flex h-12 items-center gap-3 rounded-xl border border-white/80 bg-white/90 px-4 text-sm text-stone-500 shadow-sm transition hover:bg-white hover:text-stone-700"
          >
            <Search
              aria-hidden="true"
              className="size-4 text-stone-400 transition group-hover:text-stone-500"
            />
            <span>{t("dashboard.search")}</span>
            <ArrowRight
              aria-hidden="true"
              className="ml-auto size-4 text-stone-400 transition group-hover:translate-x-0.5"
            />
          </Link>

          <div className="grid gap-3 sm:grid-cols-4">
            <StatCard label={t("dashboard.restaurants")} value={restaurants.length} />
            <StatCard label={t("dashboard.logs")} value={visits.length} />
            <StatCard
              label={t("dashboard.averageStars")}
              value={averageScore !== null ? averageScore.toFixed(1) : "0"}
              icon={<Star aria-hidden="true" className="size-5 fill-current" />}
            />
            <StatCard
              label={t("dashboard.recommendedDishes")}
              value={totalRecommendedDishes}
              icon={<Tags aria-hidden="true" className="size-5" />}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6">
        <section className="grid gap-4 lg:grid-cols-2">
          <CompactWedge
            eyebrow={t("dashboard.archiveEyebrow")}
            title={t("dashboard.archiveTitle")}
            description={t("dashboard.archiveDescription")}
          >
            <div className="grid grid-cols-2 gap-3">
              {archivePreview.map((restaurant) => (
                <RestaurantPreviewCard
                  key={restaurant.id}
                  restaurant={restaurant}
                />
              ))}
              {Array.from({ length: Math.max(0, 3 - archivePreview.length) }).map(
                (_, index) => (
                  <EmptyPreviewTile
                    key={`archive-empty-${index}`}
                    label={t("dashboard.emptyArchive")}
                  />
                ),
              )}
              <MoreTile
                href="/search"
                label={t("dashboard.more")}
                detail={t("dashboard.openArchive")}
                openLabel={t("common.open")}
              />
            </div>
          </CompactWedge>

          <CompactWedge
            eyebrow={t("dashboard.todoEyebrow")}
            title={t("dashboard.todoTitle")}
            description={t("dashboard.todoDescription")}
          >
            <div className="grid grid-cols-2 gap-3">
              {compactToDoPreview.map((item) => (
                <ToDoPreviewCard key={item.id} item={item} />
              ))}
              {Array.from({ length: Math.max(0, 3 - compactToDoPreview.length) }).map(
                (_, index) => (
                  <EmptyPreviewTile
                    key={`todo-empty-${index}`}
                    label={t("dashboard.emptyTodo")}
                  />
                ),
              )}
              <MoreTile
                href="/todo"
                label={t("dashboard.more")}
                detail={t("dashboard.openTodo")}
                openLabel={t("common.open")}
              />
            </div>
          </CompactWedge>
        </section>

      </main>
    </div>
  );
}

function CompactWedge({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="grid gap-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
          {eyebrow}
        </p>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-stone-950">{title}</h2>
            <p className="text-sm leading-6 text-stone-500">{description}</p>
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}

function RestaurantPreviewCard({
  restaurant,
}: {
  restaurant: RestaurantWithRelations;
}) {
  const latestVisit = getLatestVisit(restaurant);
  const weightedScore = getWeightedRestaurantScore(restaurant);
  const heroPhoto = restaurant.photos?.[0] ?? latestVisit?.photos?.[0];
  const tags = collectRestaurantTags(restaurant).slice(0, 2);

  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="group relative grid aspect-square overflow-hidden rounded-lg border border-stone-200 bg-stone-100 transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-sm"
    >
      {heroPhoto?.display_url || heroPhoto?.public_url ? (
        <img
          src={heroPhoto.display_url ?? heroPhoto.public_url ?? ""}
          alt={restaurant.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-stone-100 text-stone-400">
          <Sparkles aria-hidden="true" className="size-8" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 grid gap-1.5 bg-gradient-to-t from-stone-950/90 via-stone-950/65 to-transparent p-3 text-white">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <UserText
              as="p"
              text={restaurant.name}
              className="truncate text-sm font-semibold"
              translationClassName="truncate text-[11px] leading-4 text-white/75"
            />
            <p className="flex items-center gap-1 text-xs text-white/80">
              <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="truncate">
                {compactAddress(restaurant.city, restaurant.address)}
              </span>
            </p>
          </div>
          {weightedScore !== null ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-xs font-semibold">
              <span>{weightedScore.toFixed(1)}</span>
              <Star aria-hidden="true" className="size-3.5 fill-current" />
            </span>
          ) : null}
        </div>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/15 px-2 py-1 text-[11px] font-medium text-white/90"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function ToDoPreviewCard({ item }: { item: ToEatItem }) {
  const { t } = useI18n();
  const summary = [item.restaurant_name, item.city, item.cuisine_type]
    .filter(Boolean)
    .join(" · ");
  const tags = (item.tags ?? []).slice(0, 2);

  return (
    <Link
      href={`/todo/${item.id}`}
      className="group relative grid aspect-square overflow-hidden rounded-lg border border-stone-200 bg-[#fffaf0] p-3 transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-sm"
    >
      {item.source_image_url ? (
        <>
          <img
            src={item.source_image_url}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/50 to-stone-950/10" />
        </>
      ) : null}
      <div className={`relative grid h-full content-between ${item.source_image_url ? "text-white" : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <span className={`inline-flex size-8 items-center justify-center rounded-full shadow-sm ${item.source_image_url ? "bg-white/15 text-white" : "bg-white text-stone-800"}`}>
            <ClipboardList aria-hidden="true" className="size-4" />
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${item.source_image_url ? "border border-white/20 bg-white/10 text-white/80" : "border border-stone-200 bg-white text-stone-500"}`}>
            <Clock3 aria-hidden="true" className="size-3.5" />
            {item.status === "booked" ? t("dashboard.booked") : t("dashboard.toDo")}
          </span>
        </div>
        <div className="grid gap-2">
          <div>
            <UserText
              as="p"
              text={item.title}
              className={`line-clamp-2 text-sm font-semibold ${item.source_image_url ? "text-white" : "text-stone-950"}`}
              translationClassName={`line-clamp-2 text-xs leading-5 ${item.source_image_url ? "text-white/75" : "text-stone-500"}`}
            />
            <p className={`mt-1 line-clamp-2 text-xs leading-5 ${item.source_image_url ? "text-white/75" : "text-stone-500"}`}>
              {summary || t("dashboard.savedFoodLead")}
            </p>
          </div>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded-full px-2 py-1 text-[11px] font-medium ${item.source_image_url ? "border border-white/20 bg-white/10 text-white/85" : "border border-stone-200 bg-white text-stone-600"}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function EmptyPreviewTile({ label }: { label: string }) {
  return (
    <div className="grid aspect-square place-items-center rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4 text-center text-xs leading-5 text-stone-500">
      <span>{label}</span>
    </div>
  );
}

function MoreTile({
  href,
  label,
  detail,
  openLabel,
}: {
  href: string;
  label: string;
  detail: string;
  openLabel: string;
}) {
  return (
    <Link
      href={href}
      className="group grid aspect-square place-items-center rounded-lg border border-stone-200 bg-stone-950 p-4 text-center text-white transition hover:-translate-y-0.5 hover:bg-stone-800 hover:shadow-sm"
    >
      <div className="grid gap-2">
        <span className="mx-auto inline-flex size-10 items-center justify-center rounded-full bg-white/10">
          <MoreHorizontal aria-hidden="true" className="size-5" />
        </span>
        <div className="grid gap-1">
          <span className="text-base font-semibold">{label}</span>
          <span className="text-xs leading-5 text-white/70">{detail}</span>
        </div>
        <span className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-white/80">
          {openLabel}
          <ArrowRight
            aria-hidden="true"
            className="size-3.5 transition group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}

function StatCard({
  label,
  value,
  icon = null,
  valueClassName = "text-stone-950",
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-white/80 bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <p className={`mt-2 flex items-center gap-2 text-3xl font-bold ${valueClassName}`}>
        {icon}
        {value}
      </p>
    </div>
  );
}

function countRecommendedVotes(visit: VisitWithRelations) {
  return visit.dishes?.filter((dish) => dish.is_recommended).length ?? 0;
}

function getLatestVisit(restaurant: RestaurantWithRelations) {
  return [...(restaurant.visits ?? [])].sort((a, b) =>
    String(b.created_at).localeCompare(String(a.created_at)),
  )[0];
}

function collectRestaurantTags(restaurant: RestaurantWithRelations) {
  const latestVisit = getLatestVisit(restaurant);
  const values = [
    ...(latestVisit?.suitable_scenarios ?? []),
    restaurant.cuisine_type,
    ...(restaurant.dishes ?? []).map((dish) => dish.cuisine_guess),
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim());

  return Array.from(new Set(values)).slice(0, 8);
}
