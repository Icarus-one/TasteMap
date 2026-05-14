import type { LanguageCode } from "@/lib/i18n";
import type { Profile } from "@/lib/types";

export function profileInitial(
  profile?: Pick<Profile, "display_name" | "handle"> | null,
) {
  const value = profile?.display_name?.trim() || profile?.handle?.trim() || "T";
  return value.slice(0, 1).toUpperCase();
}

export function defaultDisplayNameForLanguage(language: LanguageCode) {
  if (language === "zh") return "中华小当家";
  if (language === "fr") return "Gourmand";
  return "Foodie";
}

export function generateProfileHandle() {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `foodie-${suffix}`;
}
