import { AppHeader } from "@/components/layout/AppHeader";
import { ConfigNotice } from "@/components/layout/ConfigNotice";
import { RestaurantArchiveBrowser } from "@/components/archive/RestaurantArchiveBrowser";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const { configured, restaurants } = await getDashboardData();

  return (
    <main className="min-h-screen bg-stone-50">
      <AppHeader />
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-8">
        {!configured ? <ConfigNotice /> : null}
        <section className="grid gap-2">
          <p className="text-sm font-semibold uppercase text-amber-700">
            Archive search
          </p>
          <h1 className="text-3xl font-bold text-stone-950 sm:text-4xl">
            Search your restaurant cards
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-stone-600">
            Browse the full archive with tag filters, dish keywords, cities, and
            notes when you want more than the home preview.
          </p>
        </section>
        <RestaurantArchiveBrowser restaurants={restaurants} />
      </div>
    </main>
  );
}
