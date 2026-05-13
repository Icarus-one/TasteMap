"use client";

/* eslint-disable @next/next/no-img-element */

import { FormEvent, useMemo, useState } from "react";
import {
  Clipboard,
  LinkIcon,
  Loader2,
  PencilLine,
  Plus,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import type {
  RecommendationPlatform,
  ToEatItem,
  ToEatLinkAnalysis,
} from "@/lib/types";

type ToEatListClientProps = {
  initialItems: ToEatItem[];
};

type CaptureMode = "link" | "manual";

type DraftItem = {
  id: string;
  title: string;
  note: string;
};

type LinkDraft = {
  sourceInput: string;
  sourceUrl: string;
  sourceImageUrl: string;
  sourcePlatform: RecommendationPlatform;
  title: string;
  restaurantName: string;
  city: string;
  address: string;
  cuisineType: string;
  note: string;
  shareable: boolean;
  generatedItems: DraftItem[];
};

type ManualDraft = {
  title: string;
  restaurantName: string;
  city: string;
  address: string;
  cuisineType: string;
  note: string;
  shareable: boolean;
};

const emptyLinkDraft: LinkDraft = {
  sourceInput: "",
  sourceUrl: "",
  sourceImageUrl: "",
  sourcePlatform: "manual",
  title: "",
  restaurantName: "",
  city: "",
  address: "",
  cuisineType: "",
  note: "",
  shareable: false,
  generatedItems: [],
};

const emptyManualDraft: ManualDraft = {
  title: "",
  restaurantName: "",
  city: "",
  address: "",
  cuisineType: "",
  note: "",
  shareable: false,
};

export function ToEatListClient({ initialItems }: ToEatListClientProps) {
  const [items, setItems] = useState(initialItems);
  const [captureMode, setCaptureMode] = useState<CaptureMode>("link");
  const [linkDraft, setLinkDraft] = useState<LinkDraft>(emptyLinkDraft);
  const [manualDraft, setManualDraft] = useState<ManualDraft>(emptyManualDraft);
  const [message, setMessage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ToEatLinkAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activeItems = useMemo(
    () => items.filter((item) => item.status === "to_eat" || item.status === "booked"),
    [items],
  );
  const shareableItems = activeItems.filter((item) => item.shareable);

  function updateLinkDraft(patch: Partial<LinkDraft>) {
    setLinkDraft((current) => ({ ...current, ...patch }));
  }

  function updateManualDraft(patch: Partial<ManualDraft>) {
    setManualDraft((current) => ({ ...current, ...patch }));
  }

  function updateGeneratedItem(id: string, patch: Partial<DraftItem>) {
    setLinkDraft((current) => ({
      ...current,
      generatedItems: current.generatedItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  function removeGeneratedItem(id: string) {
    setLinkDraft((current) => ({
      ...current,
      generatedItems: current.generatedItems.filter((item) => item.id !== id),
    }));
  }

  function addGeneratedItem() {
    setLinkDraft((current) => ({
      ...current,
      generatedItems: [
        ...current.generatedItems,
        {
          id: createId(),
          title: "",
          note: "",
        },
      ],
    }));
  }

  async function analyzeLink(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const sourceInput = linkDraft.sourceInput.trim();
    if (!sourceInput) return;

    setIsAnalyzing(true);
    setMessage(null);

    const response = await fetch("/api/analyze-to-eat-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_input: sourceInput }),
    }).catch(() => null);

    setIsAnalyzing(false);

    if (!response?.ok) {
      const platform = detectPlatform(sourceInput);
      const fallbackItems = [
        {
          id: createId(),
          title: titleFromPlatform(platform),
          note: "Source saved, but analysis failed. Turn this into a better item manually.",
        },
      ];
      setAnalysis({
        sourceUrl: extractUrl(sourceInput) ?? "",
        sourceImageUrl: null,
        sourcePlatform: platform,
        title: titleFromPlatform(platform),
        restaurantName: "",
        city: "",
        address: "",
        cuisineType: "",
        note: "Source saved, but link analysis failed. Add what you know and keep moving.",
        confidence: "low",
        missingFields: ["restaurant_name", "city", "cuisine_type"],
        items: fallbackItems.map((item) => ({ title: item.title, note: item.note })),
      });
      setLinkDraft((current) => ({
        ...current,
        sourceUrl: extractUrl(sourceInput) ?? "",
        sourcePlatform: platform,
        title: current.title || titleFromPlatform(platform),
        generatedItems: fallbackItems,
      }));
      setMessage("Could not fully analyze this link yet. You can still edit every field.");
      return;
    }

    const payload = (await response.json()) as {
      sourceUrl?: string | null;
      sourceImageUrl?: string | null;
      sourcePlatform?: RecommendationPlatform;
      title?: string;
      restaurant_name?: string;
      city?: string;
      address?: string;
      cuisine_type?: string;
      note?: string;
      confidence?: ToEatLinkAnalysis["confidence"];
      missing_fields?: string[];
      items?: Array<{ title?: string; note?: string | null }>;
      error?: string;
    };

    const nextAnalysis: ToEatLinkAnalysis = {
      sourceUrl: payload.sourceUrl ?? extractUrl(sourceInput),
      sourceImageUrl: payload.sourceImageUrl ?? null,
      sourcePlatform: payload.sourcePlatform ?? detectPlatform(sourceInput),
      title: payload.title ?? "Saved food recommendation",
      restaurantName: payload.restaurant_name ?? "",
      city: payload.city ?? "",
      address: payload.address ?? "",
      cuisineType: payload.cuisine_type ?? "",
      note: payload.note ?? "",
      confidence: payload.confidence ?? "unknown",
      missingFields: payload.missing_fields ?? [],
      items: normalizeAnalysisItems(payload.items),
    };

    setAnalysis(nextAnalysis);
    setLinkDraft((current) => ({
      ...current,
      sourceUrl: nextAnalysis.sourceUrl ?? "",
      sourceImageUrl: nextAnalysis.sourceImageUrl ?? "",
      sourcePlatform: nextAnalysis.sourcePlatform,
      title: nextAnalysis.title,
      restaurantName: nextAnalysis.restaurantName ?? "",
      city: nextAnalysis.city ?? "",
      address: nextAnalysis.address ?? "",
      cuisineType: nextAnalysis.cuisineType ?? "",
      note: nextAnalysis.note ?? "",
      generatedItems: createDraftItems(nextAnalysis),
    }));

    if (payload.error) {
      setMessage("Used partial source info. You can refine the restaurant info and item list before saving.");
    }
  }

  async function saveLinkItems() {
    const sourceUrl = linkDraft.sourceUrl || extractUrl(linkDraft.sourceInput) || "";
    const preparedItems = linkDraft.generatedItems
      .map((item) => ({
        ...item,
        title: item.title.trim(),
        note: item.note.trim(),
      }))
      .filter((item) => item.title);

    if ((!linkDraft.sourceInput.trim() && !sourceUrl) || preparedItems.length === 0) {
      setMessage("Analyze a link first, then keep at least one item to save.");
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const optimisticItems = preparedItems.map((item) =>
      buildOptimisticItem({
        sourceUrl,
        sourceImageUrl: emptyToNull(linkDraft.sourceImageUrl),
        sourcePlatform: linkDraft.sourcePlatform,
        restaurantName: linkDraft.restaurantName,
        city: linkDraft.city,
        address: linkDraft.address,
        cuisineType: linkDraft.cuisineType,
        note: linkDraft.note,
        shareable: linkDraft.shareable,
        item,
      }),
    );

    const results = await saveOptimisticItems(optimisticItems);

    setIsSaving(false);
    setLinkDraft(emptyLinkDraft);
    setAnalysis(null);
    handleSaveResults(results, optimisticItems, "recommendation");
  }

  async function saveManualItem(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const title = manualDraft.title.trim();
    if (!title) {
      setMessage("Manual mode needs at least one item title before saving.");
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const optimisticItem = buildOptimisticItem({
      sourceUrl: "",
      sourceImageUrl: null,
      sourcePlatform: "manual",
      restaurantName: manualDraft.restaurantName,
      city: manualDraft.city,
      address: manualDraft.address,
      cuisineType: manualDraft.cuisineType,
      note: "",
      shareable: manualDraft.shareable,
      item: {
        id: createId(),
        title,
        note: manualDraft.note,
      },
    });

    const results = await saveOptimisticItems([optimisticItem]);

    setIsSaving(false);
    setManualDraft(emptyManualDraft);
    handleSaveResults(results, [optimisticItem], "manual entry");
  }

  async function saveOptimisticItems(optimisticItems: ToEatItem[]) {
    setItems((current) => [...optimisticItems, ...current]);

    return Promise.all(
      optimisticItems.map(async (optimistic) => {
        const response = await fetch("/api/to-eat-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: optimistic.title,
            source_url: optimistic.source_url,
            source_image_url: optimistic.source_image_url ?? null,
            source_platform: optimistic.source_platform,
            restaurant_name: optimistic.restaurant_name,
            city: optimistic.city,
            address: optimistic.address,
            cuisine_type: optimistic.cuisine_type,
            note: optimistic.note,
            shareable: optimistic.shareable,
          }),
        }).catch(() => null);

        if (!response?.ok) {
          return { id: optimistic.id, saved: null };
        }

        const payload = (await response.json()) as { item?: ToEatItem };
        return { id: optimistic.id, saved: payload.item ?? null };
      }),
    );
  }

  function handleSaveResults(
    results: Array<{ id: string; saved: ToEatItem | null }>,
    optimisticItems: ToEatItem[],
    sourceLabel: string,
  ) {
    let savedCount = 0;
    let failedCount = 0;

    setItems((current) =>
      current.map((item) => {
        const result = results.find((entry) => entry.id === item.id);
        if (!result) return item;
        if (!result.saved) {
          failedCount += 1;
          return item;
        }
        savedCount += 1;
        return result.saved;
      }),
    );

    if (failedCount > 0) {
      setMessage(
        `Saved ${savedCount} item${savedCount === 1 ? "" : "s"} to storage and kept ${failedCount} item${failedCount === 1 ? "" : "s"} locally in this screen.`,
      );
      return;
    }

    setMessage(
      `Saved ${optimisticItems.length} to-do item${optimisticItems.length === 1 ? "" : "s"} from this ${sourceLabel}.`,
    );
  }

  async function copySharePack() {
    const text = buildSharePack(shareableItems);
    if (!text) {
      setMessage("Mark items as shareable before creating a share pack.");
      return;
    }

    await navigator.clipboard.writeText(text);
    setMessage("Share pack copied.");
  }

  return (
    <section className="grid gap-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
        <div className="grid gap-1">
          <p className="text-sm font-bold uppercase text-emerald-700">
            Capture recommendations
          </p>
          <h2 className="text-2xl font-bold text-stone-950">To-do items</h2>
          <p className="max-w-2xl text-sm leading-6 text-stone-600">
            Use copy link when you want the source analyzed into dishes and a post
            cover. Use manual when you just want to jot an item down fast.
          </p>
        </div>
        <button
          type="button"
          onClick={copySharePack}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-800 transition hover:border-stone-300"
        >
          <Share2 aria-hidden="true" className="size-4" />
          Share pack
        </button>
      </div>

      <div className="grid gap-3 rounded-lg bg-stone-50 p-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCaptureMode("link")}
            className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
              captureMode === "link"
                ? "bg-stone-950 text-white"
                : "border border-stone-200 bg-white text-stone-700 hover:border-stone-300"
            }`}
          >
            <LinkIcon aria-hidden="true" className="size-4" />
            Copy link
          </button>
          <button
            type="button"
            onClick={() => setCaptureMode("manual")}
            className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
              captureMode === "manual"
                ? "bg-stone-950 text-white"
                : "border border-stone-200 bg-white text-stone-700 hover:border-stone-300"
            }`}
          >
            <PencilLine aria-hidden="true" className="size-4" />
            Manual
          </button>
        </div>

        {captureMode === "link" ? (
          <>
            <form onSubmit={analyzeLink} className="grid gap-3">
              <label className="grid gap-1 text-sm font-semibold text-stone-700">
                Recommendation link
                <span className="relative">
                  <LinkIcon
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    value={linkDraft.sourceInput}
                    onChange={(event) =>
                      updateLinkDraft({ sourceInput: event.target.value })
                    }
                    className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                    placeholder="Paste 小红书 / 抖音 link"
                  />
                </span>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-sm font-bold text-stone-700">
                    <Sparkles aria-hidden="true" className="size-4 text-amber-500" />
                    {platformLabel(detectPlatform(linkDraft.sourceInput))}
                  </span>
                  <label className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-sm font-semibold text-stone-700">
                    <input
                      type="checkbox"
                      checked={linkDraft.shareable}
                      onChange={(event) =>
                        updateLinkDraft({ shareable: event.target.checked })
                      }
                      className="size-4 accent-amber-500"
                    />
                    Shareable
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={isAnalyzing || !linkDraft.sourceInput.trim()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-bold text-white transition hover:bg-stone-800 disabled:opacity-60"
                >
                  {isAnalyzing ? (
                    <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  ) : (
                    <Sparkles aria-hidden="true" className="size-4" />
                  )}
                  Analyze link
                </button>
              </div>
            </form>

            {analysis ? (
              <div className="grid gap-4 rounded-lg border border-stone-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">
                    {platformLabel(analysis.sourcePlatform)}
                  </span>
                  <span className="rounded-lg bg-stone-100 px-2 py-1 text-xs font-bold text-stone-700">
                    AI confidence: {analysis.confidence}
                  </span>
                  {analysis.missingFields.length > 0 ? (
                    <span className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">
                      Missing: {analysis.missingFields.join(", ")}
                    </span>
                  ) : null}
                </div>

                {linkDraft.sourceImageUrl ? (
                  <div className="overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
                    <img
                      src={linkDraft.sourceImageUrl}
                      alt={linkDraft.title || "Recommendation cover"}
                      className="aspect-[16/9] w-full object-cover"
                    />
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-1 text-sm font-semibold text-stone-700 md:col-span-2">
                    Source title
                    <input
                      value={linkDraft.title}
                      onChange={(event) =>
                        updateLinkDraft({ title: event.target.value })
                      }
                      className="h-11 rounded-lg border border-stone-200 bg-white px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-stone-700">
                    Restaurant
                    <input
                      value={linkDraft.restaurantName}
                      onChange={(event) =>
                        updateLinkDraft({ restaurantName: event.target.value })
                      }
                      className="h-11 rounded-lg border border-stone-200 bg-white px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                      placeholder="AI can compose a working name from clues"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-stone-700">
                    City
                    <input
                      value={linkDraft.city}
                      onChange={(event) =>
                        updateLinkDraft({ city: event.target.value })
                      }
                      className="h-11 rounded-lg border border-stone-200 bg-white px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                      placeholder="Only fill if the post says it"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-stone-700 md:col-span-2">
                    Address or area clue
                    <input
                      value={linkDraft.address}
                      onChange={(event) =>
                        updateLinkDraft({ address: event.target.value })
                      }
                      className="h-11 rounded-lg border border-stone-200 bg-white px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                      placeholder="Mall, street, neighborhood, or leave blank"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-stone-700 md:col-span-2">
                    Cuisine
                    <input
                      value={linkDraft.cuisineType}
                      onChange={(event) =>
                        updateLinkDraft({ cuisineType: event.target.value })
                      }
                      className="h-11 rounded-lg border border-stone-200 bg-white px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                      placeholder="Hotpot, ramen..."
                    />
                  </label>
                </div>

                <label className="grid gap-1 text-sm font-semibold text-stone-700">
                  Source summary
                  <textarea
                    value={linkDraft.note}
                    onChange={(event) =>
                      updateLinkDraft({ note: event.target.value })
                    }
                    rows={3}
                    className="resize-none rounded-lg border border-stone-200 bg-white px-3 py-2 font-normal leading-6 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                    placeholder="Context from the recommendation source"
                  />
                </label>

                <section className="grid gap-3 rounded-lg bg-stone-50 p-3">
                  <div className="flex items-end justify-between gap-3">
                    <div className="grid gap-1">
                      <h3 className="text-base font-bold text-stone-950">
                        Suggested dishes
                      </h3>
                      <p className="text-sm leading-6 text-stone-600">
                        These are dish items under this restaurant. Keep the dishes
                        you care about, remove the wrong ones, and add anything the
                        post mentioned but we missed.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addGeneratedItem}
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-800 transition hover:border-stone-300"
                    >
                      <Plus aria-hidden="true" className="size-4" />
                      Add item
                    </button>
                  </div>

                  {linkDraft.generatedItems.length > 0 ? (
                    <div className="grid gap-3">
                      {linkDraft.generatedItems.map((item) => (
                        <article
                          key={item.id}
                          className="grid gap-3 rounded-lg border border-stone-200 bg-white p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                              Dish item
                            </p>
                            <button
                              type="button"
                              onClick={() => removeGeneratedItem(item.id)}
                              className="inline-flex size-9 items-center justify-center rounded-lg border border-stone-200 text-stone-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                              aria-label="Remove item"
                              title="Remove item"
                            >
                              <X aria-hidden="true" className="size-4" />
                            </button>
                          </div>
                          <label className="grid gap-1 text-sm font-semibold text-stone-700">
                            Dish name
                            <input
                              value={item.title}
                              onChange={(event) =>
                                updateGeneratedItem(item.id, {
                                  title: event.target.value,
                                })
                              }
                              className="h-11 rounded-lg border border-stone-200 bg-white px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                              placeholder="鲜切牛肉"
                            />
                          </label>
                          <label className="grid gap-1 text-sm font-semibold text-stone-700">
                            Dish note
                            <textarea
                              value={item.note}
                              onChange={(event) =>
                                updateGeneratedItem(item.id, {
                                  note: event.target.value,
                                })
                              }
                              rows={2}
                              className="resize-none rounded-lg border border-stone-200 bg-white px-3 py-2 font-normal leading-6 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                              placeholder="Why this dish looked worth trying..."
                            />
                          </label>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-500">
                      No item was created yet. Add one manually before saving.
                    </div>
                  )}
                </section>

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAnalysis(null);
                      setLinkDraft(emptyLinkDraft);
                      setMessage(null);
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-stone-200 px-4 text-sm font-semibold text-stone-700 transition hover:border-stone-300"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={saveLinkItems}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-bold text-white transition hover:bg-stone-800 disabled:opacity-60"
                  >
                    {isSaving ? (
                      <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                    ) : (
                      <Clipboard aria-hidden="true" className="size-4" />
                    )}
                    Save items
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <form onSubmit={saveManualItem} className="grid gap-4 rounded-lg border border-stone-200 bg-white p-4">
            <div className="grid gap-1">
              <h3 className="text-base font-bold text-stone-950">Manual note</h3>
              <p className="text-sm leading-6 text-stone-600">
                Use this when you just want to write a to-do item directly without a
                recommendation link.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-stone-700 md:col-span-2">
                Item title
                <input
                  value={manualDraft.title}
                  onChange={(event) =>
                    updateManualDraft({ title: event.target.value })
                  }
                  className="h-11 rounded-lg border border-stone-200 bg-white px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                  placeholder="Write the dish or place you want to remember"
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-stone-700">
                Restaurant
                <input
                  value={manualDraft.restaurantName}
                  onChange={(event) =>
                    updateManualDraft({ restaurantName: event.target.value })
                  }
                  className="h-11 rounded-lg border border-stone-200 bg-white px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                  placeholder="Optional"
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-stone-700">
                City
                <input
                  value={manualDraft.city}
                  onChange={(event) =>
                    updateManualDraft({ city: event.target.value })
                  }
                  className="h-11 rounded-lg border border-stone-200 bg-white px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                  placeholder="Optional"
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-stone-700 md:col-span-2">
                Address or area
                <input
                  value={manualDraft.address}
                  onChange={(event) =>
                    updateManualDraft({ address: event.target.value })
                  }
                  className="h-11 rounded-lg border border-stone-200 bg-white px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                  placeholder="Optional"
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-stone-700 md:col-span-2">
                Cuisine
                <input
                  value={manualDraft.cuisineType}
                  onChange={(event) =>
                    updateManualDraft({ cuisineType: event.target.value })
                  }
                  className="h-11 rounded-lg border border-stone-200 bg-white px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                  placeholder="Optional"
                />
              </label>
            </div>

            <label className="grid gap-1 text-sm font-semibold text-stone-700">
              Note
              <textarea
                value={manualDraft.note}
                onChange={(event) => updateManualDraft({ note: event.target.value })}
                rows={3}
                className="resize-none rounded-lg border border-stone-200 bg-white px-3 py-2 font-normal leading-6 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                placeholder="Anything you want to remember about this item"
              />
            </label>

            <label className="inline-flex h-10 items-center gap-2 rounded-lg bg-stone-50 px-3 text-sm font-semibold text-stone-700">
              <input
                type="checkbox"
                checked={manualDraft.shareable}
                onChange={(event) =>
                  updateManualDraft({ shareable: event.target.checked })
                }
                className="size-4 accent-amber-500"
              />
              Shareable
            </label>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-bold text-white transition hover:bg-stone-800 disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Clipboard aria-hidden="true" className="size-4" />
                )}
                Save item
              </button>
            </div>
          </form>
        )}
      </div>

      {message ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {message}
        </p>
      ) : null}

      <div className="grid gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
              Live queue
            </p>
            <h3 className="text-lg font-bold text-stone-950">
              Saved to-do records now live on the home dashboard
            </h3>
            <p className="text-sm leading-6 text-stone-600">
              We kept this page focused on capture. The actual saved queue now shows
              up on your homepage.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:border-stone-300"
          >
            Go to home
          </Link>
        </div>

      </div>
    </section>
  );
}

function normalizeAnalysisItems(
  items?: Array<{ title?: string; note?: string | null }>,
) {
  return (items ?? [])
    .map((item) => ({
      title: item.title?.trim() ?? "",
      note: item.note?.trim() ?? "",
    }))
    .filter((item) => item.title);
}

function createDraftItems(analysis: ToEatLinkAnalysis) {
  if (analysis.items.length > 0) {
    return analysis.items.map((item) => ({
      id: createId(),
      title: item.title,
      note: item.note ?? "",
    }));
  }

  return [
    {
      id: createId(),
      title: analysis.title,
      note: analysis.note ?? "",
    },
  ];
}

function buildOptimisticItem({
  sourceUrl,
  sourceImageUrl,
  sourcePlatform,
  restaurantName,
  city,
  address,
  cuisineType,
  note,
  shareable,
  item,
}: {
  sourceUrl: string;
  sourceImageUrl: string | null;
  sourcePlatform: RecommendationPlatform;
  restaurantName: string;
  city: string;
  address: string;
  cuisineType: string;
  note: string;
  shareable: boolean;
  item: DraftItem;
}) {
  return {
    id: createId(),
    user_id: "local",
    title: item.title.trim(),
    source_url: sourceUrl || null,
    source_image_url: sourceImageUrl,
    source_platform: sourcePlatform,
    source_creator: null,
    restaurant_name: emptyToNull(restaurantName),
    city: emptyToNull(city),
    address: emptyToNull(address),
    cuisine_type: emptyToNull(cuisineType),
    note: joinNotes(item.note, note),
    tags: [],
    priority: 3,
    status: "to_eat" as const,
    shareable,
    linked_restaurant_id: null,
    linked_visit_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } satisfies ToEatItem;
}

function joinNotes(itemNote: string, summaryNote: string) {
  const values = [itemNote.trim(), summaryNote.trim()].filter(Boolean);
  if (values.length === 0) return null;
  if (values.length === 2 && values[0] === values[1]) return values[0];
  return values.join("\n\n");
}

function detectPlatform(value: string): RecommendationPlatform {
  const lower = value.toLowerCase();
  if (lower.includes("xiaohongshu.com") || lower.includes("xhslink.com")) {
    return "xiaohongshu";
  }
  if (lower.includes("douyin.com") || lower.includes("iesdouyin.com")) {
    return "douyin";
  }
  if (lower.includes("instagram.com")) return "instagram";
  if (lower.includes("tiktok.com")) return "tiktok";
  if (lower.includes("http")) return "web";
  return "manual";
}

function extractUrl(value: string) {
  const match = value.match(/https?:\/\/[^\s]+/i);
  return match?.[0]?.replace(/[，。),\]]+$/g, "") ?? null;
}

function platformLabel(platform: RecommendationPlatform) {
  if (platform === "xiaohongshu") return "小红书";
  if (platform === "douyin") return "抖音";
  if (platform === "instagram") return "Instagram";
  if (platform === "tiktok") return "TikTok";
  if (platform === "web") return "Web";
  return "Manual";
}

function titleFromPlatform(platform: RecommendationPlatform) {
  if (platform === "xiaohongshu") return "小红书美食推荐";
  if (platform === "douyin") return "抖音美食推荐";
  if (platform === "instagram") return "Instagram food save";
  if (platform === "tiktok") return "TikTok food save";
  return "Saved food recommendation";
}

function buildSharePack(items: ToEatItem[]) {
  if (items.length === 0) return "";
  return [
    "TasteMap to-eat list",
    ...items.map((item, index) => {
      const title = `${index + 1}. ${item.title}`;
      const meta = [item.restaurant_name, item.city, item.cuisine_type]
        .filter(Boolean)
        .join(" · ");
      const note = item.note ? `Note: ${item.note}` : "";
      const url = item.source_url ? `Source: ${item.source_url}` : "";
      return [title, meta, note, url].filter(Boolean).join("\n");
    }),
  ].join("\n\n");
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function createId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}
