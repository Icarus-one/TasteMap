"use client";

import { type ElementType, useEffect, useMemo, useState } from "react";
import { useLanguage, type LanguageCode } from "@/lib/i18n";

type SourceLanguage = LanguageCode | "unknown";

type UserTextProps<T extends ElementType = "span"> = {
  text: string | null | undefined;
  as?: T;
  className?: string;
  translationAs?: ElementType;
  translationClassName?: string;
  translate?: boolean;
};

const translationCache = new Map<string, string | null>();

export function UserText<T extends ElementType = "span">({
  text,
  as,
  className,
  translationAs = "p",
  translationClassName = "mt-1 text-xs leading-5 text-stone-500",
  translate = true,
}: UserTextProps<T>) {
  const language = useLanguage();
  const value = text?.trim() ?? "";
  const sourceLanguage = useMemo(() => detectTextLanguage(value), [value]);
  const requestKey = shouldTranslate(value, sourceLanguage, language)
    ? `${language}:${sourceLanguage}:${value}`
    : null;
  const [translationResult, setTranslationResult] = useState<{
    key: string;
    value: string | null;
  } | null>(null);
  const translation =
    requestKey && translationResult?.key === requestKey
      ? translationResult.value
      : null;

  useEffect(() => {
    if (!translate || !requestKey) return;

    if (translationCache.has(requestKey)) {
      queueMicrotask(() => {
        setTranslationResult({
          key: requestKey,
          value: translationCache.get(requestKey) ?? null,
        });
      });
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    fetch("/api/translate-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: value,
        source_language: sourceLanguage,
        target_language: language,
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = (await response.json().catch(() => null)) as {
          translated_text?: unknown;
        } | null;
        const translatedText =
          typeof payload?.translated_text === "string"
            ? payload.translated_text.trim()
            : "";
        return isUsefulTranslation(value, translatedText) ? translatedText : null;
      })
      .then((translatedText) => {
        if (controller.signal.aborted) return;
        translationCache.set(requestKey, translatedText);
        setTranslationResult({ key: requestKey, value: translatedText });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        translationCache.set(requestKey, null);
        setTranslationResult({ key: requestKey, value: null });
      });

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [language, requestKey, sourceLanguage, translate, value]);

  if (!value) return null;

  const TextElement = as ?? "span";
  const TranslationElement = translationAs;

  return (
    <>
      <TextElement className={className}>{value}</TextElement>
      {translation ? (
        <TranslationElement className={translationClassName}>
          {translation}
        </TranslationElement>
      ) : null}
    </>
  );
}

function shouldTranslate(
  value: string,
  sourceLanguage: SourceLanguage,
  targetLanguage: LanguageCode,
) {
  if (!value || sourceLanguage === "unknown") return false;
  if (sourceLanguage === targetLanguage) return false;
  if (value.length > 700) return false;
  if (isLikelyUntranslatableShortName(value, sourceLanguage)) return false;
  return true;
}

function isUsefulTranslation(original: string, translated: string) {
  if (!translated) return false;
  return normalizeForComparison(original) !== normalizeForComparison(translated);
}

function normalizeForComparison(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[。！？,.!?;:，；：]/g, "")
    .trim();
}

function detectTextLanguage(value: string): SourceLanguage {
  const text = value.trim();
  if (!text) return "unknown";

  const cjkMatches = text.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  if (cjkMatches >= 1) return "zh";

  const latinMatches = text.match(/[a-zA-ZÀ-ÿ]/g)?.length ?? 0;
  if (latinMatches < 2) return "unknown";

  if (/[àâçéèêëîïôùûüÿœæ]/i.test(text)) return "fr";
  if (/\b(le|la|les|des|du|une|avec|pour|dans|très|bon|bonne)\b/i.test(text)) {
    return "fr";
  }

  return "en";
}

function isLikelyUntranslatableShortName(
  value: string,
  sourceLanguage: SourceLanguage,
) {
  if (sourceLanguage !== "en" && sourceLanguage !== "fr") return false;
  return /^[a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ0-9'&.-]{0,15}$/.test(value.trim());
}
