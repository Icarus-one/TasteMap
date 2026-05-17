import type { ReactNode } from "react";
import Link from "next/link";
import { Settings, Users } from "lucide-react";
import { I18nText } from "@/components/i18n/I18nText";
import { BackButton } from "@/components/layout/BackButton";
import { LanguageMenu } from "@/components/layout/LanguageMenu";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
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
    <>
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-stone-50/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <BackButton />
            {showAuthActions ? <ProfileMenu profile={profile} compact /> : null}
            <Link href="/" className="flex min-w-0 items-baseline gap-1.5 sm:gap-2">
              <span className="truncate text-base font-bold text-stone-950 sm:text-lg">
                TasteMap
              </span>
              <span className="hidden text-sm font-semibold text-stone-500 sm:inline">
                味迹
              </span>
            </Link>
          </div>
          <nav className="flex shrink-0 items-center gap-2">
            <LanguageMenu />
            {showAuthActions ? (
              actions ?? (
                <>
                  <Link
                    href="/friends"
                    aria-label="Friends"
                    className="hidden size-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 sm:inline-flex"
                    title="Friends"
                  >
                    <Users aria-hidden="true" className="size-4" />
                    <span className="sr-only">Friends</span>
                  </Link>
                  <Link
                    href="/settings"
                    aria-label="Settings"
                    className="hidden size-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 sm:inline-flex"
                    title="Settings"
                  >
                    <Settings aria-hidden="true" className="size-4" />
                    <span className="sr-only">
                      <I18nText k="header.settings" />
                    </span>
                  </Link>
                </>
              )
            ) : null}
          </nav>
        </div>
      </header>
      {showAuthActions ? <MobileBottomNav /> : null}
    </>
  );
}
