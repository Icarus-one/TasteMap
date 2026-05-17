import { AppHeader } from "@/components/layout/AppHeader";
import { ConfigNotice } from "@/components/layout/ConfigNotice";
import { I18nText } from "@/components/i18n/I18nText";
import { RestaurantArchiveBrowser } from "@/components/archive/RestaurantArchiveBrowser";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const { configured, restaurants } = await getDashboardData();

  return (
    <main className="min-h-screen bg-stone-50 pb-24 sm:pb-0">
      <AppHeader />
      <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8">
        {!configured ? <ConfigNotice /> : null}
        <section className="grid gap-2">
          <p className="text-sm font-semibold uppercase text-amber-700">
            <I18nText k="page.search.eyebrow" />
          </p>
          <h1 className="text-2xl font-bold text-stone-950 sm:text-4xl">
            <I18nText k="page.search.title" />
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-stone-600">
            <I18nText k="page.search.subtitle" />
          </p>
        </section>
        <RestaurantArchiveBrowser restaurants={restaurants} />
      </div>
    </main>
  );
}
