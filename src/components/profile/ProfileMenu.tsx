"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { profileInitial } from "@/lib/profileUtils";
import { useI18n } from "@/lib/i18n";
import type { Profile } from "@/lib/types";

type ProfileMenuProps = {
  profile: Pick<Profile, "display_name" | "handle" | "avatar_url"> | null;
  compact?: boolean;
};

export function ProfileMenu({ profile, compact = false }: ProfileMenuProps) {
  const { t } = useI18n();

  if (!profile) {
    return (
      <Link
        href="/profile"
        className="inline-flex size-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
        aria-label={t("profile.title")}
        title={t("profile.title")}
      >
        <UserRound aria-hidden="true" className="size-4" />
      </Link>
    );
  }

  return (
    <Link
      href="/profile"
      className={`inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-1.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 sm:px-2 ${compact ? "sm:max-w-36" : "sm:max-w-56"}`}
      aria-label={t("profile.title")}
      title={t("profile.title")}
    >
      {profile.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt=""
          className="size-7 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-stone-950 text-xs font-bold text-white">
          {profileInitial(profile)}
        </span>
      )}
      <span
        className={`${compact ? "hidden min-w-0 text-left sm:block" : "min-w-0 text-left"}`}
      >
        <span className="block truncate leading-4">
          {profile.display_name ?? t("profile.title")}
        </span>
        {profile.handle ? (
          <span className="block truncate text-[11px] leading-4 text-stone-500">
            @{profile.handle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
