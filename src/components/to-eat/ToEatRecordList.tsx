"use client";

/* eslint-disable @next/next/no-img-element */

import {
  Archive,
  CheckCircle2,
  ExternalLink,
  Share2,
  Trash2,
} from "lucide-react";
import { UserText } from "@/components/i18n/UserText";
import type { ToEatItem } from "@/lib/types";

type ToEatRecordListProps = {
  items: ToEatItem[];
  emptyLabel?: string;
  mode?: "display" | "manage";
  onPatch?: (id: string, patch: Partial<ToEatItem>) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
};

export function ToEatRecordList({
  items,
  emptyLabel = "Save a link or a manual note to start building your private queue.",
  mode = "display",
  onPatch,
  onDelete,
}: ToEatRecordListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 p-5 text-center text-sm text-stone-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="grid gap-3 rounded-lg border border-stone-200 p-3"
        >
          <div
            className={`grid gap-3 ${
              item.source_image_url ? "md:grid-cols-[120px_1fr]" : ""
            }`}
          >
            {item.source_image_url ? (
              <div className="overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
                <img
                  src={item.source_image_url}
                  alt={item.title}
                  className="aspect-square h-full w-full object-cover"
                />
              </div>
            ) : null}

            <div className="grid gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">
                      {platformLabel(item.source_platform)}
                    </span>
                    {item.shareable ? (
                      <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">
                        Shareable
                      </span>
                    ) : null}
                  </div>
                  <UserText
                    as="h3"
                    text={item.title}
                    className="font-bold text-stone-950"
                  />
                  <p className="text-sm leading-6 text-stone-600">
                    {summarizeItem(item)}
                  </p>
                </div>
                {item.source_url ? (
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 text-stone-600 transition hover:border-stone-300"
                    aria-label="Open recommendation source"
                    title="Open recommendation source"
                  >
                    <ExternalLink aria-hidden="true" className="size-4" />
                  </a>
                ) : null}
              </div>
              {item.note ? (
                <UserText
                  as="p"
                  text={item.note}
                  className="text-sm leading-6 text-stone-600"
                />
              ) : null}
              {mode === "manage" ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onPatch?.(item.id, {
                        status: item.status === "booked" ? "to_eat" : "booked",
                      })
                    }
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-stone-200 px-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300"
                  >
                    <CheckCircle2 aria-hidden="true" className="size-4" />
                    {item.status === "booked" ? "Booked" : "Plan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onPatch?.(item.id, { status: "visited" })}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-stone-200 px-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300"
                  >
                    <CheckCircle2 aria-hidden="true" className="size-4" />
                    Ate it
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onPatch?.(item.id, { shareable: !item.shareable })
                    }
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-stone-200 px-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300"
                  >
                    <Share2 aria-hidden="true" className="size-4" />
                    {item.shareable ? "Private" : "Share"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onPatch?.(item.id, { status: "archived" })}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-stone-200 px-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300"
                  >
                    <Archive aria-hidden="true" className="size-4" />
                    Archive
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete?.(item.id)}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function platformLabel(platform: ToEatItem["source_platform"]) {
  if (platform === "xiaohongshu") return "小红书";
  if (platform === "douyin") return "抖音";
  if (platform === "instagram") return "Instagram";
  if (platform === "tiktok") return "TikTok";
  if (platform === "web") return "Web";
  return "Manual";
}

function summarizeItem(item: ToEatItem) {
  return (
    [item.restaurant_name, item.city, item.cuisine_type]
      .filter(Boolean)
      .join(" · ") || "Unsorted food lead"
  );
}
