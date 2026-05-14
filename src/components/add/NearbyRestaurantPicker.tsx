"use client";

import { Link2, MapPin, PencilLine, Star } from "lucide-react";
import type {
  RestaurantCandidate,
  RestaurantMatchCandidate,
} from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { AddressMapPicker } from "./AddressMapPicker";

export type RestaurantDraft = {
  mode: "existing" | "provider" | "manual";
  restaurant_id?: string | null;
  provider_place_id?: string | null;
  provider_name?: string | null;
  input_name?: string | null;
  name: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cuisine_type?: string | null;
};

type NearbyRestaurantPickerProps = {
  candidates: RestaurantCandidate[];
  archiveMatches?: RestaurantMatchCandidate[];
  mapsApiKey: string | null;
  selected: RestaurantDraft;
  onChange: (restaurant: RestaurantDraft) => void;
  onSelectArchiveMatch: (candidate: RestaurantMatchCandidate) => void;
};

export function NearbyRestaurantPicker({
  candidates,
  archiveMatches = [],
  mapsApiKey,
  selected,
  onChange,
  onSelectArchiveMatch,
}: NearbyRestaurantPickerProps) {
  const { t } = useI18n();

  return (
    <section className="grid gap-4">
      <div className="grid gap-1">
        <h2 className="text-xl font-bold text-stone-950">
          {t("restaurant.confirm.title")}
        </h2>
        <p className="text-sm leading-6 text-stone-600">
          {t("restaurant.confirm.subtitle")}
        </p>
      </div>

      {archiveMatches.length > 0 ? (
        <div className="grid gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
          <div className="grid gap-1">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-stone-700">
              <Link2 aria-hidden="true" className="size-4" />
              {t("restaurant.matches.title")}
            </h3>
            <p className="text-sm leading-6 text-stone-600">
              {t("restaurant.matches.subtitle")}
            </p>
          </div>
          <div className="grid gap-3">
            {archiveMatches.map((match) => {
              const isSelected =
                selected.mode === "existing" &&
                selected.restaurant_id === match.id;

              return (
                <button
                  key={match.id}
                  type="button"
                  onClick={() => onSelectArchiveMatch(match)}
                  className={`grid gap-2 rounded-lg border bg-white p-4 text-left shadow-sm transition ${
                    isSelected
                      ? "border-emerald-500 ring-2 ring-emerald-100"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="grid gap-1">
                      <span className="font-bold text-stone-950">{match.name}</span>
                      <span className="text-sm text-stone-500">
                        {[match.city, match.address].filter(Boolean).join(" · ") ||
                          t("restaurant.noLocation")}
                      </span>
                    </div>
                    <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-stone-700">
                      {match.confidence}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {match.matched_on.map((reason) => (
                      <span
                        key={reason}
                        className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-600"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {candidates.length > 0 ? (
        <div className="grid gap-3">
          {candidates.map((candidate) => {
            const isSelected =
              selected.mode === "provider" &&
              selected.provider_place_id === candidate.providerPlaceId;

            return (
              <button
                key={`${candidate.provider}:${candidate.providerPlaceId}`}
                type="button"
                onClick={() =>
                  onChange({
                    mode: "provider",
                    provider_place_id: candidate.providerPlaceId,
                    provider_name: candidate.provider,
                    input_name: candidate.name,
                    name: candidate.name,
                    address: candidate.address ?? null,
                    city: null,
                    country: null,
                    latitude: candidate.latitude ?? null,
                    longitude: candidate.longitude ?? null,
                    cuisine_type: candidate.cuisineOrCategory ?? null,
                  })
                }
                className={`grid gap-2 rounded-lg border bg-white p-4 text-left shadow-sm transition ${
                  isSelected
                    ? "border-emerald-500 ring-2 ring-emerald-100"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="grid gap-1">
                    <span className="font-bold text-stone-950">{candidate.name}</span>
                    {candidate.address ? (
                      <span className="text-sm leading-5 text-stone-500">
                        {candidate.address}
                      </span>
                    ) : null}
                  </span>
                  {candidate.distanceMeters !== null &&
                  candidate.distanceMeters !== undefined ? (
                    <span className="shrink-0 rounded-lg bg-stone-100 px-2.5 py-1 text-sm font-semibold text-stone-700">
                      {Math.round(candidate.distanceMeters)}m
                    </span>
                  ) : null}
                </span>
                <span className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
                  {candidate.cuisineOrCategory ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin aria-hidden="true" className="size-4" />
                      {candidate.cuisineOrCategory}
                    </span>
                  ) : null}
                  {candidate.providerRating ? (
                    <span className="inline-flex items-center gap-1">
                      <Star aria-hidden="true" className="size-4" />
                      {candidate.providerRating.toFixed(1)}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-stone-300 bg-white p-5 text-sm leading-6 text-stone-600">
          {t("restaurant.noCandidates")}
        </div>
      )}

      <div className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-stone-950">
          <PencilLine aria-hidden="true" className="size-4" />
          {t("restaurant.manual.title")}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold text-stone-700 sm:col-span-2">
            {t("restaurant.name")}
            <input
              value={selected.mode === "manual" ? selected.name : ""}
              onChange={(event) =>
                onChange({
                  ...emptyManualRestaurant(),
                  input_name: event.target.value,
                  name: event.target.value,
                })
              }
              onFocus={() => {
                if (selected.mode !== "manual") onChange(emptyManualRestaurant());
              }}
              className="h-11 rounded-lg border border-stone-200 px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
              placeholder={t("restaurant.namePlaceholder")}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-stone-700">
            {t("restaurant.city")}
            <input
              value={selected.mode === "manual" ? (selected.city ?? "") : ""}
              onChange={(event) =>
                onChange({
                  ...selected,
                  mode: "manual",
                  input_name:
                    selected.mode === "manual"
                      ? selected.input_name ?? selected.name
                      : selected.name,
                  city: event.target.value,
                })
              }
              className="h-11 rounded-lg border border-stone-200 px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
              placeholder="London"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-stone-700 sm:col-span-2">
            {t("restaurant.address")}
            <input
              value={selected.mode === "manual" ? (selected.address ?? "") : ""}
              onChange={(event) =>
                onChange({
                  ...selected,
                  mode: "manual",
                  input_name:
                    selected.mode === "manual"
                      ? selected.input_name ?? selected.name
                      : selected.name,
                  address: event.target.value,
                })
              }
              className="h-11 rounded-lg border border-stone-200 px-3 font-normal outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
              placeholder={t("restaurant.addressPlaceholder")}
            />
          </label>
          <AddressMapPicker
            apiKey={mapsApiKey}
            selected={selected}
            onChange={onChange}
          />
        </div>
      </div>
    </section>
  );
}

export function emptyManualRestaurant(): RestaurantDraft {
  return {
    mode: "manual",
    restaurant_id: null,
    provider_place_id: null,
    provider_name: null,
    input_name: "",
    name: "",
    address: "",
    city: "",
    country: "",
    latitude: null,
    longitude: null,
    cuisine_type: "",
  };
}
