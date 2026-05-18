"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { AnalyticsEventName } from "@/lib/types";

const sessionStorageKey = "tastemap-analytics-session";

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const path = normalizePath(pathname);
    const sessionId = getSessionId();
    const pageKind = getPageKind(path);

    void sendAnalyticsEvent("page_view", path, sessionId, { page_kind: pageKind });

    const detailEvent = getDetailEvent(path);
    if (detailEvent) {
      void sendAnalyticsEvent(detailEvent, path, sessionId, { page_kind: pageKind });
    }
  }, [pathname]);

  return null;
}

async function sendAnalyticsEvent(
  eventName: AnalyticsEventName,
  path: string,
  sessionId: string,
  metadata: Record<string, unknown>,
) {
  try {
    await fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: eventName,
        path,
        session_id: sessionId,
        metadata,
      }),
      keepalive: true,
    });
  } catch {
    // Analytics should never interrupt the app experience.
  }
}

function getSessionId() {
  try {
    const existing = window.sessionStorage.getItem(sessionStorageKey);
    if (existing) return existing;

    const next =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.sessionStorage.setItem(sessionStorageKey, next);
    return next;
  } catch {
    return "unknown-session";
  }
}

function normalizePath(pathname: string | null) {
  if (!pathname) return "/";
  return pathname.slice(0, 300);
}

function getDetailEvent(path: string): AnalyticsEventName | null {
  if (path.startsWith("/restaurants/")) return "restaurant_opened";
  if (path.startsWith("/visits/")) return "visit_opened";
  if (path.startsWith("/todo/")) return "to_eat_item_opened";
  return null;
}

function getPageKind(path: string) {
  if (path === "/") return "dashboard";
  if (path.startsWith("/add")) return "add";
  if (path.startsWith("/restaurants/")) return "restaurant_detail";
  if (path.startsWith("/visits/")) return "visit_detail";
  if (path.startsWith("/todo/")) return "to_eat_detail";
  if (path === "/todo") return "to_eat_list";
  if (path.startsWith("/friends")) return "friends";
  if (path.startsWith("/map")) return "map";
  if (path.startsWith("/search")) return "search";
  if (path.startsWith("/settings")) return "settings";
  if (path.startsWith("/metrics")) return "metrics";
  return "other";
}
