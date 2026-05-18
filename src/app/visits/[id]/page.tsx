import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bot,
  CalendarDays,
  Circle,
  Coins,
  ChevronLeft,
  LocateFixed,
  MapPin,
  Tags,
  Users,
  Utensils,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { PhotoGallery } from "@/components/detail/PhotoGallery";
import { ShareActionButton } from "@/components/share/ShareActionButton";
import { UserText } from "@/components/i18n/UserText";
import { RestaurantLocationMap } from "@/components/map/RestaurantLocationMap";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { compactAddress, formatAveragePrice, formatDate } from "@/lib/format";
import { getVisitById } from "@/lib/data";
import { buildVisitShareText } from "@/lib/share";
import type { VisitWithRelations } from "@/lib/types";

type VisitPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function VisitPage({ params }: VisitPageProps) {
  const { id } = await params;
  const visit = await getVisitById(id);

  if (!visit) notFound();

  const tags = collectVisitTags(visit);
  const shareText = buildVisitShareText(visit);

  return (
    <main className="min-h-screen bg-stone-50 pb-24 sm:pb-0">
      <AppHeader />
      <div className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-5 sm:gap-8 sm:px-6 sm:py-8">
        <Link
          href={
            visit.restaurants?.id ? `/restaurants/${visit.restaurants.id}` : "/"
          }
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-950"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          Back to restaurant
        </Link>

        <section className="grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
            <div className="grid gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold uppercase text-emerald-700">
                <CalendarDays aria-hidden="true" className="size-4" />
                {formatDate(visit.visit_date ?? visit.taken_at)}
              </p>
              <UserText
                as="h1"
                text={visit.restaurants?.name ?? "Unknown restaurant"}
                className="text-2xl font-bold text-stone-950 sm:text-4xl"
                translationClassName="text-sm leading-6 text-stone-500"
              />
              {visit.summary ? (
                <UserText
                  as="p"
                  text={visit.summary}
                  className="max-w-3xl text-base leading-7 text-stone-700"
                  translationClassName="max-w-3xl text-sm leading-6 text-stone-500"
                />
              ) : null}
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
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
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap md:justify-end">
              <ShareActionButton
                title={visit.restaurants?.name ?? "Restaurant log"}
                text={shareText}
                urlPath={`/visits/${visit.id}`}
                label="Share"
              />
              <ScoreBadge score={visit.total_score} label="Stars" />
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-bold text-stone-950">Photos</h2>
          <PhotoGallery photos={visit.photos} />
        </section>

        <RestaurantLocationMap
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? null}
          name={visit.restaurants?.name ?? "Unknown restaurant"}
          address={compactAddress(
            visit.restaurants?.city ?? null,
            visit.restaurants?.address ?? null,
            visit.restaurants?.latitude ?? null,
            visit.restaurants?.longitude ?? null,
          )}
          latitude={visit.restaurants?.latitude ?? null}
          longitude={visit.restaurants?.longitude ?? null}
        />

        <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold text-stone-950">
              <Utensils aria-hidden="true" className="size-5" />
              Dishes
            </h2>
            {visit.dishes && visit.dishes.length > 0 ? (
              <div className="grid gap-3">
                {visit.dishes.map((dish) => (
                  <div
                    key={dish.id}
                    className="grid gap-2 rounded-lg border border-stone-200 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <UserText
                        as="h3"
                        text={dish.name}
                        className="font-bold text-stone-950"
                      />
                      <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-sm font-semibold text-stone-700">
                        {dish.ai_confidence}
                      </span>
                    </div>
                    {dish.visible_ingredients && dish.visible_ingredients.length > 0 ? (
                      <p className="text-sm leading-6 text-stone-600">
                        {dish.visible_ingredients.join(", ")}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {dish.is_recommended ? (
                        <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-800">
                          Recommended
                        </span>
                      ) : dish.is_bad ? (
                        <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-sm font-semibold text-rose-800">
                          Skip next time
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 text-sm font-semibold text-stone-700">
                          <Circle aria-hidden="true" className="size-3.5" />
                          Neutral
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-500">No dishes saved for this visit.</p>
            )}
          </div>

          <VisitFacts visit={visit} />
        </section>

        {visit.detailed_review ? (
          <section className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="text-xl font-bold text-stone-950">Log note</h2>
            <p className="whitespace-pre-wrap text-sm leading-7 text-stone-700">
              <UserText
                text={visit.detailed_review}
                translationAs="span"
                translationClassName="mt-2 block text-xs leading-6 text-stone-500"
              />
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function VisitFacts({ visit }: { visit: VisitWithRelations }) {
  return (
    <aside className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-xl font-bold text-stone-950">Log facts</h2>
      <Fact
        icon={<MapPin aria-hidden="true" className="size-4" />}
        label="Restaurant"
        value={visit.restaurants?.name ?? "Unknown"}
      />
      <Fact
        icon={<LocateFixed aria-hidden="true" className="size-4" />}
        label="Location source"
        value={`${visit.location_source} / ${visit.location_confidence}`}
      />
      {visit.companions ? (
        <Fact
          icon={<Users aria-hidden="true" className="size-4" />}
          label="With"
          value={visit.companions}
        />
      ) : null}
      <Fact
        icon={<Bot aria-hidden="true" className="size-4" />}
        label="AI generated"
        value={visit.ai_generated ? "Yes, user confirmed" : "No"}
      />
      <Fact
        icon={<Utensils aria-hidden="true" className="size-4" />}
        label="Restaurant match"
        value={visit.restaurant_match_source}
      />
      {visit.average_price !== null && visit.average_price !== undefined ? (
        <Fact
          icon={<Coins aria-hidden="true" className="size-4" />}
          label="Per person"
          value={formatAveragePrice(
            visit.average_price,
            visit.restaurants?.currency ?? "GBP",
          )}
        />
      ) : null}
      {visit.recommended_dishes ? (
        <Fact
          icon={<Utensils aria-hidden="true" className="size-4" />}
          label="Recommended"
          value={visit.recommended_dishes}
        />
      ) : null}
      {visit.bad_dishes ? (
        <Fact
          icon={<Utensils aria-hidden="true" className="size-4" />}
          label="Skip"
          value={visit.bad_dishes}
        />
      ) : null}
      {collectVisitTags(visit).length > 0 ? (
        <Fact
          icon={<Tags aria-hidden="true" className="size-4" />}
          label="Tags"
          value={collectVisitTags(visit).join(", ")}
        />
      ) : null}
    </aside>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-1 rounded-lg bg-stone-50 p-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase text-stone-500">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold text-stone-900">{value}</p>
    </div>
  );
}

function collectVisitTags(visit: VisitWithRelations) {
  const values = [
    ...(visit.suitable_scenarios ?? []),
    visit.restaurants?.cuisine_type,
    ...(visit.dishes ?? []).map((dish) => dish.cuisine_guess),
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim());

  return Array.from(new Set(values)).slice(0, 4);
}
