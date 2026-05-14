"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ClipboardList, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type NewEntryMenuProps = {
  variant?: "hero" | "header";
};

export function NewEntryMenu({ variant = "hero" }: NewEntryMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { t } = useI18n();

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

  const buttonClass =
    variant === "hero"
      ? "inline-flex h-11 items-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-stone-800"
      : "inline-flex h-10 items-center gap-2 rounded-lg bg-stone-950 px-3 text-sm font-semibold text-white transition hover:bg-stone-800";

  const panelClass =
    variant === "hero"
      ? "sm:right-0 sm:top-[calc(100%+0.5rem)] sm:w-56"
      : "sm:right-0 sm:top-[calc(100%+0.5rem)] sm:w-52";

  return (
    <div ref={rootRef} className="relative z-50">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={buttonClass}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {variant === "header" ? (
          <Plus aria-hidden="true" className="size-4" />
        ) : null}
        {t("header.new")}
        <ChevronDown
          aria-hidden="true"
          className={`size-4 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-stone-950/10 sm:hidden"
            aria-label={t("common.close")}
            onClick={() => setOpen(false)}
          />
          <div
            className={`fixed inset-x-4 top-28 z-50 grid gap-2 rounded-lg border border-stone-200 bg-white p-2 shadow-2xl sm:absolute sm:inset-x-auto sm:p-1 sm:shadow-xl ${panelClass}`}
            role="menu"
          >
            <MenuLink
              href="/add"
              label={t("header.newPostLog")}
              description={t("header.newPostLogDescription")}
              icon={<Plus aria-hidden="true" className="size-4" />}
            />
            <MenuLink
              href="/todo"
              label={t("header.newToDo")}
              description={t("header.newToDoDescription")}
              icon={<ClipboardList aria-hidden="true" className="size-4" />}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  label,
  description,
  icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="grid min-h-16 gap-1 rounded-md px-3 py-3 text-left transition hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 sm:min-h-0 sm:py-2"
      role="menuitem"
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-stone-950">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-900 sm:size-auto sm:bg-transparent">
          {icon}
        </span>
        {label}
      </span>
      <span className="text-xs leading-5 text-stone-500">{description}</span>
    </Link>
  );
}
