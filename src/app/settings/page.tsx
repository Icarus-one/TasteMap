import { AppHeader } from "@/components/layout/AppHeader";
import { ConfigNotice } from "@/components/layout/ConfigNotice";
import { I18nText } from "@/components/i18n/I18nText";
import { SettingsClient } from "@/components/settings/SettingsClient";
import { getSessionContext } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { configured, user } = await getSessionContext({ protect: true });

  return (
    <main className="min-h-screen bg-stone-50 pb-24 sm:pb-0">
      <AppHeader />
      <div className="mx-auto grid w-full max-w-3xl gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8">
        {!configured ? <ConfigNotice /> : null}
        <section className="grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-2">
            <p className="text-sm font-semibold uppercase text-emerald-700">
              <I18nText k="settings.eyebrow" />
            </p>
            <h1 className="text-2xl font-bold text-stone-950 sm:text-3xl">
              <I18nText k="settings.title" />
            </h1>
            <p className="text-sm leading-6 text-stone-600">
              <I18nText k="settings.signedInAs" />{" "}
              {user?.email ?? <I18nText k="settings.notConfigured" />}.
            </p>
          </div>
          <div className="rounded-lg bg-stone-50 p-4 text-sm leading-6 text-stone-700">
            <I18nText k="settings.securityNote" />
          </div>
          <SettingsClient />
        </section>
      </div>
    </main>
  );
}
