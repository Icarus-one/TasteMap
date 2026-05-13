"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ClipboardList, Plus } from "lucide-react";

type NewEntryMenuProps = {
  variant?: "hero" | "header";
};

export function NewEntryMenu({ variant = "hero" }: NewEntryMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

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
      ? "right-0 top-[calc(100%+0.5rem)] w-56"
      : "right-0 top-[calc(100%+0.5rem)] w-52";

  return (
    <div ref={rootRef} className="relative">
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
        New
        <ChevronDown
          aria-hidden="true"
          className={`size-4 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          className={`absolute z-40 grid gap-1 rounded-lg border border-stone-200 bg-white p-1 shadow-xl ${panelClass}`}
          role="menu"
        >
          <MenuLink
            href="/add"
            label="Post log"
            description="Upload a meal and save a restaurant log."
            icon={<Plus aria-hidden="true" className="size-4" />}
            onSelect={() => setOpen(false)}
          />
          <MenuLink
            href="/todo"
            label="To do item"
            description="Save a place or food lead for later."
            icon={<ClipboardList aria-hidden="true" className="size-4" />}
            onSelect={() => setOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  label,
  description,
  icon,
  onSelect,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="grid gap-1 rounded-md px-3 py-2 text-left transition hover:bg-stone-50"
      role="menuitem"
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-stone-950">
        {icon}
        {label}
      </span>
      <span className="text-xs leading-5 text-stone-500">{description}</span>
    </Link>
  );
}
