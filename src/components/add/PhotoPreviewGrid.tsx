"use client";

/* eslint-disable @next/next/no-img-element */

import { Clock, LocateFixed, MapPin, X } from "lucide-react";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { UploadedPhoto } from "@/lib/types";

type PhotoPreviewGridProps = {
  photos: UploadedPhoto[];
  onRemove?: (id: string) => void;
};

export function PhotoPreviewGrid({ photos, onRemove }: PhotoPreviewGridProps) {
  const { t } = useI18n();

  if (photos.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map((photo, index) => (
        <article
          key={photo.id}
          className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm"
        >
          <div className="relative aspect-[4/3] bg-stone-100">
            <img
              src={photo.previewUrl}
              alt="Uploaded food"
              className="h-full w-full object-cover"
            />
            {onRemove ? (
              <button
                type="button"
                onClick={() => onRemove(photo.id)}
                className="absolute right-2 top-2 inline-flex size-9 items-center justify-center rounded-lg bg-white/95 text-stone-700 shadow-sm transition hover:bg-white"
                aria-label="Remove photo"
                title="Remove photo"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            ) : null}
            <span className="absolute left-2 top-2 inline-flex items-center rounded-lg bg-white/95 px-2.5 py-1 text-xs font-bold text-stone-800 shadow-sm">
              {photoLabel(photo, index, t)}
            </span>
          </div>
          <div className="grid gap-2 p-3 text-sm text-stone-600">
            <p className="flex items-center gap-2">
              <Clock aria-hidden="true" className="size-4 text-stone-400" />
              {formatDate(photo.takenAt)}
            </p>
            <p className="flex items-center gap-2">
              {photo.locationSource === "exif" ? (
                <LocateFixed aria-hidden="true" className="size-4 text-emerald-600" />
              ) : (
                <MapPin aria-hidden="true" className="size-4 text-stone-400" />
              )}
              {locationLabel(photo)}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

function photoLabel(
  photo: UploadedPhoto,
  index: number,
  t: ReturnType<typeof useI18n>["t"],
) {
  const photoType = photo.intendedPhotoType ?? photo.aiAnalysis?.photoType;
  if (photoType === "restaurant") return t("photoUpload.restaurantBadge");
  if (photoType === "dish") return t("photoUpload.dishBadge");
  return index === 0
    ? t("photoUpload.restaurantBadge")
    : t("photoUpload.dishBadge");
}

function locationLabel(photo: UploadedPhoto) {
  if (photo.locationSource === "exif") return "GPS from photo";
  if (photo.locationSource === "device") return "Device location";
  if (photo.locationSource === "manual") return "Manual location";
  return "No location yet";
}
