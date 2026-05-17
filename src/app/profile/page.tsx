import { AppHeader } from "@/components/layout/AppHeader";
import { ConfigNotice } from "@/components/layout/ConfigNotice";
import { I18nText } from "@/components/i18n/I18nText";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { getSessionContext } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { configured, profile } = await getSessionContext({ protect: true });

  return (
    <main className="min-h-screen bg-stone-50 pb-24 sm:pb-0">
      <AppHeader />
      <div className="mx-auto grid w-full max-w-3xl gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8">
        {!configured ? <ConfigNotice /> : null}
        <section className="grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid gap-2">
              <p className="text-sm font-semibold uppercase text-emerald-700">
                <I18nText k="profile.eyebrow" />
              </p>
              <h1 className="text-2xl font-bold text-stone-950 sm:text-3xl">
                <I18nText k="profile.title" />
              </h1>
              <p className="text-sm leading-6 text-stone-600">
                <I18nText k="profile.publicIdentity" />
              </p>
            </div>
            <SignOutButton />
          </div>
          <ProfileForm initialProfile={profile} />
        </section>
      </div>
    </main>
  );
}
