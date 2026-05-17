"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

type ShareActionButtonProps = {
  title: string;
  text: string;
  urlPath?: string;
  shareEndpoint?: string;
  label?: string;
  className?: string;
};

export function ShareActionButton({
  title,
  text,
  urlPath,
  shareEndpoint,
  label = "Share",
  className = "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:border-stone-300 sm:w-auto",
}: ShareActionButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function handleShare() {
    let url =
      typeof window !== "undefined"
        ? urlPath
          ? new URL(urlPath, window.location.origin).toString()
          : window.location.href
        : undefined;

    if (shareEndpoint) {
      const response = await fetch(shareEndpoint, { method: "POST" });
      const payload = (await response.json().catch(() => null)) as {
        url?: string;
      } | null;

      if (!response.ok || !payload?.url) {
        setStatus("error");
        window.setTimeout(() => setStatus("idle"), 2200);
        return;
      }

      url = payload.url;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text,
          url,
        });
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
    }

    const fallbackText = [title, text, url].filter(Boolean).join("\n\n");
    await navigator.clipboard.writeText(fallbackText);
    setStatus("copied");
    window.setTimeout(() => setStatus("idle"), 1800);
  }

  return (
    <button type="button" onClick={() => void handleShare()} className={className}>
      {status === "copied" ? (
        <>
          <Check aria-hidden="true" className="size-4" />
          Copied
        </>
      ) : status === "error" ? (
        <>
          <Share2 aria-hidden="true" className="size-4" />
          Try again
        </>
      ) : (
        <>
          <Share2 aria-hidden="true" className="size-4" />
          {label}
        </>
      )}
    </button>
  );
}
