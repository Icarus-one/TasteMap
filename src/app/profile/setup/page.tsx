import { AppHeader } from "@/components/layout/AppHeader";
import { I18nText } from "@/components/i18n/I18nText";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { fallbackProfileFromUser } from "@/lib/profile";
import { getSessionContext } from "@/lib/data";

type ProfileSetupPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export const dynamic = "force-dynamic";

export default async function ProfileSetupPage({
  searchParams,
}: ProfileSetupPageProps) {
  const { next } = await searchParams;
  const { profile, user } = await getSessionContext({
    protect: true,
    skipProfileSetup: true,
  });
  const initialProfile = profile ?? (user ? fallbackProfileFromUser(user) : null);

  return (
    <main className="min-h-screen bg-stone-50">
      <AppHeader showAuthActions={false} />
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center px-4 py-10 sm:px-6">
        <div className="mx-auto grid w-full max-w-md gap-6 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="grid gap-2 text-center">
            <p className="text-sm font-semibold uppercase text-emerald-700">
              <I18nText k="profile.setupEyebrow" />
            </p>
            <h1 className="text-2xl font-bold text-stone-950">
              <I18nText k="profile.setupTitle" />
            </h1>
            <p className="text-sm leading-6 text-stone-600">
              <I18nText k="profile.setupSubtitle" />
            </p>
          </div>
          <ProfileForm
            initialProfile={initialProfile}
            mode="setup"
            nextPath={next ?? "/"}
          />
        </div>
      </section>
    </main>
  );
}
