import { AppHeader } from "@/components/layout/AppHeader";
import { ConfigNotice } from "@/components/layout/ConfigNotice";
import { I18nText } from "@/components/i18n/I18nText";
import {
  RestaurantMapClient,
  type RestaurantMapPoint,
} from "@/components/map/RestaurantMapClient";
import { getDashboardData } from "@/lib/data";
import { getWeightedRestaurantScore } from "@/lib/scoring";
import type { RestaurantWithRelations } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const { configured, restaurants } = await getDashboardData();
  const points = restaurants.flatMap(toMapPoint);
  const missingLocationCount = restaurants.length - points.length;

  return (
    <main className="min-h-screen bg-stone-50 pb-24 sm:pb-0">
      <AppHeader />
      <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8">
        {!configured ? <ConfigNotice /> : null}
        <section className="grid gap-2">
          <p className="text-sm font-semibold uppercase text-amber-700">
            <I18nText k="page.map.eyebrow" />
          </p>
          <h1 className="text-2xl font-bold text-stone-950 sm:text-4xl">
            <I18nText k="page.map.title" />
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-stone-600">
            <I18nText k="page.map.subtitle" />
          </p>
        </section>
        <RestaurantMapClient
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? null}
          points={points}
          missingLocationCount={missingLocationCount}
        />
      </div>
    </main>
  );
}

function toMapPoint(restaurant: RestaurantWithRelations): RestaurantMapPoint[] {
  if (typeof restaurant.latitude !== "number" || typeof restaurant.longitude !== "number") {
    return [];
  }

  const visits = [...(restaurant.visits ?? [])].sort((a, b) =>
    String(b.created_at).localeCompare(String(a.created_at)),
  );

  return [
    {
      id: restaurant.id,
      name: restaurant.name,
      city: restaurant.city,
      address: restaurant.address,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      score: getWeightedRestaurantScore(restaurant),
      visitCount: visits.length,
      latestSummary: visits[0]?.summary ?? null,
    },
  ];
}
