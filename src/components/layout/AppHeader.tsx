import type { ReactNode } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { I18nText } from "@/components/i18n/I18nText";
import { BackButton } from "@/components/layout/BackButton";
import { LanguageMenu } from "@/components/layout/LanguageMenu";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { getCurrentProfile } from "@/lib/profile";

type AppHeaderProps = {
  showAuthActions?: boolean;
  actions?: ReactNode;
};

export async function AppHeader({
  showAuthActions = true,
  actions,
}: AppHeaderProps) {
  const profile = showAuthActions ? await getCurrentProfile() : null;

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-stone-50/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <BackButton />
          {showAuthActions ? <ProfileMenu profile={profile} compact /> : null}
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-stone-950">TasteMap</span>
            <span className="text-sm font-semibold text-stone-500">味迹</span>
          </Link>
        </div>
        <nav className="flex items-center gap-2">
          <LanguageMenu />
          {showAuthActions ? (
            actions ?? (
              <Link
                href="/settings"
                aria-label="Settings"
                className="inline-flex size-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
                title="Settings"
              >
                <Settings aria-hidden="true" className="size-4" />
                <span className="sr-only">
                  <I18nText k="header.settings" />
                </span>
              </Link>
            )
          ) : null}
        </nav>
      </div>
    </header>
  );
}
