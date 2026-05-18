"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect } from "react";
import type { ShareEventName } from "@/lib/types";

const visitorStorageKey = "tastemap-share-visitor";

type ShareAttributionTrackerProps = {
  token: string;
};

type TrackableShareLinkProps = ShareAttributionTrackerProps & {
  href: string;
  eventName: Extract<
    ShareEventName,
    "share_signup_clicked" | "share_login_clicked"
  >;
  className?: string;
  children: ReactNode;
};

export function ShareAttributionTracker({ token }: ShareAttributionTrackerProps) {
  useEffect(() => {
    void sendShareEvent(token, "share_opened", {
      path: window.location.pathname,
      referrer_origin: safeReferrerOrigin(document.referrer),
    });
  }, [token]);

  return null;
}

export function TrackableShareLink({
  token,
  href,
  eventName,
  className,
  children,
}: TrackableShareLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        void sendShareEvent(token, eventName, {
          path: window.location.pathname,
          target_path: href.split("?")[0],
        });
      }}
    >
      {children}
    </Link>
  );
}

async function sendShareEvent(
  token: string,
  eventName: ShareEventName,
  metadata: Record<string, unknown>,
) {
  try {
    await fetch(`/api/share/restaurants/${token}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: eventName,
        visitor_id: getVisitorId(),
        metadata,
      }),
    });
  } catch {
    // Share tracking should never interrupt the public share flow.
  }
}

function getVisitorId() {
  try {
    const existing = window.localStorage.getItem(visitorStorageKey);
    if (existing) return existing;

    const next =
      window.crypto?.randomUUID?.() ??
      `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(visitorStorageKey, next);
    return next;
  } catch {
    return null;
  }
}

function safeReferrerOrigin(referrer: string) {
  if (!referrer) return null;

  try {
    return new URL(referrer).origin;
  } catch {
    return null;
  }
}
