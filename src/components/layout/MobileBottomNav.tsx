"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, MapPinned, PlusCircle, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const navItems = [
  { href: "/", labelKey: "nav.home", icon: Home, exact: true },
  { href: "/map", labelKey: "nav.map", icon: MapPinned, exact: false },
  { href: "/add", labelKey: "nav.add", icon: PlusCircle, exact: false },
  { href: "/friends", labelKey: "nav.friends", icon: Users, exact: false },
  { href: "/todo", labelKey: "nav.todo", icon: ClipboardList, exact: false },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-1.5 shadow-[0_-10px_30px_rgba(28,25,23,0.08)] backdrop-blur sm:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {navItems.map(({ href, labelKey, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          const label = t(labelKey);

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={`grid min-h-14 place-items-center gap-0.5 rounded-lg px-1 text-[11px] font-semibold transition ${
                isActive
                  ? "bg-stone-950 text-white"
                  : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
              }`}
            >
              <Icon aria-hidden="true" className="size-5" />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
