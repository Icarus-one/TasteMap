"use client";

import { useEffect, useState } from "react";
import { ListPlus, Loader2, Plus } from "lucide-react";
import type { TasteListItem, TasteListWithRelations } from "@/lib/types";

type TasteListForClient = TasteListWithRelations & {
  is_owner?: boolean;
  taste_list_items?: TasteListItem[];
};

type AddRestaurantToListButtonProps = {
  restaurantId: string;
  restaurantName: string;
};

export function AddRestaurantToListButton({
  restaurantId,
  restaurantName,
}: AddRestaurantToListButtonProps) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<TasteListForClient[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    async function loadLists() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/taste-lists");
        const payload = (await response.json()) as {
          lists?: TasteListForClient[];
          error?: string;
        };
        if (!response.ok) throw new Error(payload.error);
        const ownLists = (payload.lists ?? []).filter((list) => list.is_owner);
        setLists(ownLists);
        setSelectedListId((current) => current || ownLists[0]?.id || "");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not load lists.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadLists();
  }, [open]);

  async function addToList() {
    if (!selectedListId) return;
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/taste-lists/${selectedListId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          note,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error);
      setNote("");
      setMessage("Added to list.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add to list.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-800 transition hover:border-stone-300 hover:bg-stone-50"
      >
        <ListPlus aria-hidden="true" className="size-4" />
        Add to list
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/30 px-4">
          <div className="grid w-full max-w-md gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-xl">
            <div>
              <p className="text-sm font-semibold uppercase text-emerald-700">
                Shared wishlist
              </p>
              <h2 className="text-2xl font-bold text-stone-950">
                Add {restaurantName} to a list
              </h2>
            </div>

            {isLoading ? (
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600">
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                Loading lists
              </p>
            ) : lists.length ? (
              <>
                <label className="grid gap-1 text-sm font-semibold text-stone-700">
                  List
                  <select
                    value={selectedListId}
                    onChange={(event) => setSelectedListId(event.target.value)}
                    className="h-11 rounded-lg border border-stone-200 px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                  >
                    {lists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-semibold text-stone-700">
                  Note
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    className="resize-none rounded-lg border border-stone-200 px-3 py-2 font-normal leading-6 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                    placeholder="Why it belongs here."
                  />
                </label>
              </>
            ) : (
              <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4 text-sm leading-6 text-stone-600">
                Create a list from the Friends page first, then add restaurants
                into it from their cards.
              </p>
            )}

            {message ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                {message}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setMessage(null);
                  setError(null);
                }}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:border-stone-300"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isSaving || !selectedListId}
                onClick={() => void addToList()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Plus aria-hidden="true" className="size-4" />
                )}
                Add
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
