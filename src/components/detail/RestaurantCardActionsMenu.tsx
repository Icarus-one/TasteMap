"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PencilLine, Settings, Trash2 } from "lucide-react";

type RestaurantCardActionsMenuProps = {
  restaurant: {
    id: string;
    name: string;
    city: string | null;
    address: string | null;
  };
};

export function RestaurantCardActionsMenu({
  restaurant,
}: RestaurantCardActionsMenuProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(restaurant.name);
  const [city, setCity] = useState(restaurant.city ?? "");
  const [address, setAddress] = useState(restaurant.address ?? "");

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    const response = await fetch(`/api/restaurants/${restaurant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        city: city.trim() || null,
        address: address.trim() || null,
      }),
    });

    setIsSaving(false);

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      setError(payload?.error ?? "Could not update this card.");
      return;
    }

    setIsEditing(false);
    setOpen(false);
    router.refresh();
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this restaurant card and all logs under it?",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    const response = await fetch(`/api/restaurants/${restaurant.id}`, {
      method: "DELETE",
    });

    setIsDeleting(false);

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      setError(payload?.error ?? "Could not delete this card.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Card settings"
        title="Card settings"
        className="inline-flex size-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
      >
        <Settings aria-hidden="true" className="size-4" />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-40 grid min-w-52 gap-2 rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setOpen(false);
            }}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
          >
            <PencilLine aria-hidden="true" className="size-4" />
            Edit card
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void handleDelete();
            }}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
          >
            <Trash2 aria-hidden="true" className="size-4" />
            {isDeleting ? "Deleting..." : "Delete card"}
          </button>
        </div>
      ) : null}

      {isEditing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/30 px-4">
          <div className="grid w-full max-w-md gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-xl">
            <div className="grid gap-1">
              <p className="text-sm font-semibold uppercase text-emerald-700">
                Edit card
              </p>
              <h2 className="text-2xl font-bold text-stone-950">
                Update restaurant info
              </h2>
            </div>

            <label className="grid gap-1 text-sm font-semibold text-stone-700">
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-11 rounded-lg border border-stone-200 px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-stone-700">
              City
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="h-11 rounded-lg border border-stone-200 px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-stone-700">
              Address
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="h-11 rounded-lg border border-stone-200 px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
              />
            </label>

            {error ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setError(null);
                  setName(restaurant.name);
                  setCity(restaurant.city ?? "");
                  setAddress(restaurant.address ?? "");
                }}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:border-stone-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving || !name.trim()}
                onClick={() => void handleSave()}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
