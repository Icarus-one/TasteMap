"use client";

/* eslint-disable @next/next/no-img-element */

import { Check, Plus, Sparkles, Trash2 } from "lucide-react";
import type { Confidence, DetectedDish } from "@/lib/types";

export type EditableDish = DetectedDish & {
  isRecommended: boolean;
  isBad: boolean;
};

type DishRecognitionReviewProps = {
  dishes: EditableDish[];
  onChange: (dishes: EditableDish[]) => void;
};

export function DishRecognitionReview({
  dishes,
  onChange,
}: DishRecognitionReviewProps) {
  function updateDish(id: string, patch: Partial<EditableDish>) {
    onChange(
      dishes.map((dish) => (dish.id === id ? { ...dish, ...patch } : dish)),
    );
  }

  function addDish() {
    onChange([
      ...dishes,
      {
        id: createId(),
        nameGuess: "",
        name: "",
        cuisineGuess: "",
        category: "main",
        visibleIngredients: [],
        confidence: "unknown",
        userConfirmed: false,
        isRecommended: false,
        isBad: false,
        sourcePhotoId: undefined,
        sourcePhotoPreviewUrl: undefined,
        sourcePhotoLabel: undefined,
      },
    ]);
  }

  return (
    <section className="grid gap-4">
      <div className="flex items-end justify-between gap-3">
        <div className="grid gap-1">
          <h2 className="text-xl font-bold text-stone-950">Confirm dishes</h2>
          <p className="text-sm leading-6 text-stone-600">
            Mark what tasted good, what to skip next time, and add any dish the
            photo missed.
          </p>
        </div>
        <button
          type="button"
          onClick={addDish}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-800 transition hover:border-stone-300"
        >
          <Plus aria-hidden="true" className="size-4" />
          Add dish
        </button>
      </div>

      {dishes.length > 0 ? (
        <div className="grid gap-3">
          {dishes.map((dish) => (
            <article
              key={dish.id}
              className="grid gap-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
            >
              {dish.sourcePhotoPreviewUrl ? (
                <div className="grid gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3 sm:grid-cols-[8rem_1fr] sm:items-center">
                  <div className="overflow-hidden rounded-lg bg-stone-100">
                    <img
                      src={dish.sourcePhotoPreviewUrl}
                      alt={dish.name || dish.nameGuess || "Detected dish source"}
                      className="aspect-[4/3] h-full w-full object-cover"
                    />
                  </div>
                  <div className="grid gap-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                      Matched photo
                    </p>
                    <p className="text-sm text-stone-700">
                      {dish.sourcePhotoLabel ?? "Source image for this detected dish"}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-800">
                    <Sparkles aria-hidden="true" className="size-4" />
                    {confidenceLabel(dish.confidence)}
                  </span>
                  {dish.userConfirmed ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 text-sm font-semibold text-stone-700">
                      <Check aria-hidden="true" className="size-4" />
                      Confirmed
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onChange(dishes.filter((item) => item.id !== dish.id))}
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-stone-200 text-stone-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  aria-label="Delete dish"
                  title="Delete dish"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-semibold text-stone-700">
                  Dish name
                  <input
                    value={dish.name}
                    onChange={(event) =>
                      updateDish(dish.id, {
                        name: event.target.value,
                        userConfirmed: true,
                      })
                    }
                    className="h-11 rounded-lg border border-stone-200 px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                    placeholder="Beef ramen"
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-stone-700">
                  Cuisine
                  <input
                    value={dish.cuisineGuess ?? ""}
                    onChange={(event) =>
                      updateDish(dish.id, { cuisineGuess: event.target.value })
                    }
                    className="h-11 rounded-lg border border-stone-200 px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                    placeholder="Japanese"
                  />
                </label>
              </div>

              {dish.visibleIngredients && dish.visibleIngredients.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {dish.visibleIngredients.map((ingredient) => (
                    <span
                      key={ingredient}
                      className="rounded-lg border border-stone-200 px-2.5 py-1 text-sm text-stone-600"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 px-3 text-sm font-semibold text-stone-700">
                  <input
                    type="checkbox"
                    checked={dish.isRecommended}
                    onChange={(event) =>
                      updateDish(dish.id, {
                        isRecommended: event.target.checked,
                        isBad: event.target.checked ? false : dish.isBad,
                      })
                    }
                    className="size-4 accent-emerald-700"
                  />
                  Recommended
                </label>
                <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 px-3 text-sm font-semibold text-stone-700">
                  <input
                    type="checkbox"
                    checked={dish.isBad}
                    onChange={(event) =>
                      updateDish(dish.id, {
                        isBad: event.target.checked,
                        isRecommended: event.target.checked
                          ? false
                          : dish.isRecommended,
                      })
                    }
                    className="size-4 accent-rose-700"
                  />
                  Skip next time
                </label>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-stone-300 bg-white p-5 text-sm leading-6 text-stone-600">
          No reliable dish was detected. Add one manually or continue with only the
          restaurant and rating.
        </div>
      )}
    </section>
  );
}

function confidenceLabel(confidence: Confidence) {
  if (confidence === "high") return "High confidence";
  if (confidence === "medium") return "Medium confidence";
  if (confidence === "low") return "Low confidence";
  return "AI guess";
}

function createId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}
