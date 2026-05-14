"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type QuickRatingFormProps = {
  stars: number;
  averagePrice: string;
  availableTags: string[];
  summary: string;
  tags: string[];
  onStarsChange: (stars: number) => void;
  onAveragePriceChange: (value: string) => void;
  onSummaryChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void;
};

export function QuickRatingForm({
  stars,
  averagePrice,
  availableTags,
  summary,
  tags,
  onStarsChange,
  onAveragePriceChange,
  onSummaryChange,
  onTagsChange,
}: QuickRatingFormProps) {
  const [tagDraft, setTagDraft] = useState("");
  const { t } = useI18n();

  function addTag(rawValue: string) {
    const nextTag = rawValue.trim();
    if (!nextTag) return;

    const normalized = nextTag.toLowerCase();
    if (tags.some((tag) => tag.toLowerCase() === normalized)) return;
    onTagsChange([...tags, nextTag].slice(0, 12));
  }

  return (
    <section className="grid gap-4">
      <div className="grid gap-1">
        <h2 className="text-xl font-bold text-stone-950">{t("rating.title")}</h2>
        <p className="text-sm leading-6 text-stone-600">
          {t("rating.subtitle")}
        </p>
      </div>

      <div className="grid gap-5 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-stone-900">
              {t("rating.starRating")}
            </span>
            <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-sm font-semibold text-stone-700">
              {formatStars(stars)}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 text-amber-500">
            {Array.from({ length: 5 }, (_, index) => {
              const filledWidth = Math.max(
                0,
                Math.min(1, stars - index),
              );

              return (
                <span key={index} className="relative inline-flex size-9">
                  <Star
                    aria-hidden="true"
                    className="absolute inset-0 size-9 text-stone-200"
                  />
                  <span
                    className="absolute inset-y-0 left-0 overflow-hidden"
                    style={{ width: `${filledWidth * 100}%` }}
                  >
                    <Star
                      aria-hidden="true"
                      className="size-9 fill-current text-amber-500"
                    />
                  </span>
                </span>
              );
            })}
          </div>
          <label className="grid gap-2 text-sm font-semibold text-stone-700">
            <span>{t("rating.rangeLabel")}</span>
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={stars}
              onChange={(event) => onStarsChange(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-amber-500"
              aria-label={t("rating.starRating")}
            />
          </label>
          <div className="flex flex-wrap justify-between gap-2 text-xs font-medium text-stone-500">
            <span>0</span>
            <span>2.5</span>
            <span>5</span>
          </div>
          <p className="text-sm text-stone-500">
            {stars >= 4.5
              ? t("rating.mustRemember")
              : stars >= 4
                ? t("rating.strongMeal")
                : stars >= 3
                  ? t("rating.solid")
                  : stars >= 1.5
                    ? t("rating.notAgain")
                    : t("rating.rough")}
          </p>
        </div>

        <label className="grid gap-2 text-sm font-semibold text-stone-700">
          {t("rating.spend")}
          <input
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={averagePrice}
            onChange={(event) => onAveragePriceChange(event.target.value)}
            className="h-11 rounded-lg border border-stone-200 px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            placeholder={t("rating.optional")}
          />
        </label>

        <div className="grid gap-2 text-sm font-semibold text-stone-700">
          <span>{t("rating.tags")}</span>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  onTagsChange(tags.filter((item) => item !== tag))
                }
                className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300"
                title={t("rating.removeTag")}
              >
                <span>{tag}</span>
                <span className="text-stone-400">x</span>
              </button>
            ))}
          </div>
          {availableTags.length > 0 ? (
            <div className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                {t("rating.existingTags")}
              </span>
              <div className="flex flex-wrap gap-2">
                {availableTags
                  .filter(
                    (tag) =>
                      !tags.some(
                        (selectedTag) =>
                          selectedTag.toLowerCase() === tag.toLowerCase(),
                      ),
                  )
                  .slice(0, 16)
                  .map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onTagsChange([...tags, tag].slice(0, 12))}
                      className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
                    >
                      {tag}
                    </button>
                  ))}
              </div>
            </div>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === ",") {
                  event.preventDefault();
                  addTag(tagDraft);
                  setTagDraft("");
                }
              }}
              className="h-11 flex-1 rounded-lg border border-stone-200 px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
              placeholder={t("rating.addTagPlaceholder")}
            />
            <button
              type="button"
              onClick={() => {
                addTag(tagDraft);
                setTagDraft("");
              }}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:border-stone-300"
            >
              {t("rating.addTag")}
            </button>
          </div>
          <p className="text-xs font-medium text-stone-500">
            {t("rating.tagHelp")}
          </p>
        </div>

        <label className="grid gap-2 text-sm font-semibold text-stone-700">
          {t("rating.logNote")}
          <textarea
            value={summary}
            onChange={(event) => onSummaryChange(event.target.value)}
            rows={4}
            className="resize-none rounded-lg border border-stone-200 px-3 py-2 font-normal leading-6 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            placeholder={t("rating.notePlaceholder")}
          />
        </label>
      </div>
    </section>
  );
}

function formatStars(stars: number) {
  return `${Number.isInteger(stars) ? stars.toFixed(0) : stars.toFixed(1)} / 5`;
}
