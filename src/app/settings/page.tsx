import { AppHeader } from "@/components/layout/AppHeader";
import { ConfigNotice } from "@/components/layout/ConfigNotice";
import { SettingsClient } from "@/components/settings/SettingsClient";
import { getSessionContext } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { configured, user } = await getSessionContext({ protect: true });

  return (
    <main className="min-h-screen bg-stone-50">
      <AppHeader />
      <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-6 sm:px-6 sm:py-8">
        {!configured ? <ConfigNotice /> : null}
        <section className="grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-2">
            <p className="text-sm font-semibold uppercase text-emerald-700">
              Settings
            </p>
            <h1 className="text-3xl font-bold text-stone-950">Private archive</h1>
            <p className="text-sm leading-6 text-stone-600">
              Signed in as {user?.email ?? "not configured"}.
            </p>
          </div>
          <div className="rounded-lg bg-stone-50 p-4 text-sm leading-6 text-stone-700">
            All TasteMap records are stored under your Supabase user id. Row Level
            Security policies restrict restaurants, visits, dishes, photos, and place
            candidates to the owning account.
          </div>
          <SettingsClient />
        </section>
      </div>
    </main>
  );
}
