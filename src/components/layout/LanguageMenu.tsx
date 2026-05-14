"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import {
  languageOptions,
  setBrowserLanguage,
  useI18n,
  type LanguageCode,
} from "@/lib/i18n";

export function LanguageMenu() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const { language, t } = useI18n();

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function selectLanguage(nextLanguage: LanguageCode) {
    setBrowserLanguage(nextLanguage);
    setOpen(false);
  }

  const active = languageOptions.find((option) => option.code === language);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("header.language")}
        title={t("header.language")}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
      >
        <Languages aria-hidden="true" className="size-4" />
        <span className="uppercase">{active?.code ?? "en"}</span>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 grid w-48 gap-1 rounded-lg border border-stone-200 bg-white p-1 shadow-xl"
        >
          {languageOptions.map((option) => (
            <button
              key={option.code}
              type="button"
              role="menuitemradio"
              aria-checked={option.code === language}
              onClick={() => selectLanguage(option.code)}
              className="grid rounded-md px-3 py-2 text-left transition hover:bg-stone-50"
            >
              <span className="flex items-center justify-between gap-3 text-sm font-semibold text-stone-950">
                {option.nativeLabel}
                {option.code === language ? (
                  <Check aria-hidden="true" className="size-4 text-emerald-700" />
                ) : null}
              </span>
              <span className="text-xs text-stone-500">{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
