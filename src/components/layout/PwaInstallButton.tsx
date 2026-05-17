"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share2, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const isStandalone = useSyncExternalStore(
    subscribeToStandaloneChanges,
    getStandaloneSnapshot,
    () => false,
  );
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setInstallPrompt(null);
      setShowHint(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) {
      setShowHint(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome !== "dismissed") {
      setInstallPrompt(null);
    }
  }

  if (isStandalone) return null;

  return (
    <div className="grid gap-2 sm:hidden">
      <button
        type="button"
        onClick={() => void handleInstall()}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/80 bg-white/90 px-3 text-sm font-bold text-stone-900 shadow-sm transition hover:bg-white"
      >
        <Download aria-hidden="true" className="size-4" />
        Install app
      </button>
      {showHint ? (
        <div className="grid gap-2 rounded-lg border border-amber-200 bg-white/95 p-3 text-sm leading-6 text-stone-700 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p>
              Use the browser menu or share button, then choose{" "}
              <span className="font-semibold text-stone-950">
                Add to Home Screen
              </span>
              .
            </p>
            <button
              type="button"
              onClick={() => setShowHint(false)}
              aria-label="Dismiss install hint"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <Share2 aria-hidden="true" className="size-3.5" />
            iPhone Safari needs the share menu
          </p>
        </div>
      ) : null}
    </div>
  );
}

function getStandaloneSnapshot() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function subscribeToStandaloneChanges(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(display-mode: standalone)");
  mediaQuery.addEventListener("change", onStoreChange);
  window.addEventListener("appinstalled", onStoreChange);

  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
    window.removeEventListener("appinstalled", onStoreChange);
  };
}
