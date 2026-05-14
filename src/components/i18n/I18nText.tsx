"use client";

import { translate, type I18nKey, useLanguage } from "@/lib/i18n";

type I18nTextProps = {
  k: I18nKey;
};

export function I18nText({ k }: I18nTextProps) {
  const language = useLanguage();
  return <>{translate(k, language)}</>;
}
