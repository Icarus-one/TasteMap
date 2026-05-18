"use client";

import { useState } from "react";
import { Check, ClipboardPlus, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type AddSharedRestaurantToDoButtonProps = {
  shareToken: string;
  restaurant: {
    name: string;
    city: string | null;
    address: string | null;
    cuisine_type: string | null;
  };
  note: string | null;
  tags: string[];
};

export function AddSharedRestaurantToDoButton({
  shareToken,
  restaurant,
  note,
  tags,
}: AddSharedRestaurantToDoButtonProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function addToList() {
    setStatus("saving");
    setMessage(null);

    const response = await fetch("/api/to-eat-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: restaurant.name,
        source_platform: "manual",
        restaurant_name: restaurant.name,
        city: restaurant.city,
        address: restaurant.address,
        cuisine_type: restaurant.cuisine_type,
        note,
        tags,
        priority: 3,
        status: "to_eat",
        shareable: false,
        source_share_token: shareToken,
      }),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      setStatus("error");
      setMessage(payload?.error ?? t("share.addError"));
      return;
    }

    setStatus("saved");
    setMessage(t("share.addedMessage"));
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={status === "saving" || status === "saved"}
        onClick={() => void addToList()}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-70"
      >
        {status === "saving" ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : status === "saved" ? (
          <Check aria-hidden="true" className="size-4" />
        ) : (
          <ClipboardPlus aria-hidden="true" className="size-4" />
        )}
        {status === "saved" ? t("share.added") : t("share.addToDo")}
      </button>
      {message ? (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            status === "error"
              ? "border-rose-200 bg-rose-50 text-rose-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
