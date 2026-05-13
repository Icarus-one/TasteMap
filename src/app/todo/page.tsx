import { AppHeader } from "@/components/layout/AppHeader";
import { ConfigNotice } from "@/components/layout/ConfigNotice";
import { ToEatListClient } from "@/components/to-eat/ToEatListClient";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function TodoPage() {
  const { configured, toEatItems } = await getDashboardData();

  return (
    <main className="min-h-screen bg-stone-50">
      <AppHeader />
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 sm:px-6 sm:py-8">
        {!configured ? <ConfigNotice /> : null}
        <section className="grid gap-2">
          <p className="text-sm font-semibold uppercase text-amber-700">
            Private queue
          </p>
          <h1 className="text-3xl font-bold text-stone-950 sm:text-4xl">
            To do items
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-stone-600">
            Save links, restaurant leads, and food ideas you want to come back to.
            This stays private, editable, and easy to turn into a real log later.
          </p>
        </section>
        <ToEatListClient initialItems={toEatItems} />
      </div>
    </main>
  );
}
