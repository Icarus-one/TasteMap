/* eslint-disable @next/next/no-img-element */

import { ImageIcon } from "lucide-react";
import type { Photo } from "@/lib/types";

type PhotoGalleryProps = {
  photos?: Photo[] | null;
};

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const visiblePhotos = (photos ?? []).filter(
    (photo) => photo.display_url || photo.public_url,
  );

  if (visiblePhotos.length === 0) {
    return (
      <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-stone-300 bg-white text-sm text-stone-500">
        <span className="inline-flex items-center gap-2">
          <ImageIcon aria-hidden="true" className="size-4" />
          No photos saved for this record.
        </span>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {visiblePhotos.map((photo) => (
        <figure
          key={photo.id}
          className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm"
        >
          <img
            src={photo.display_url ?? photo.public_url ?? ""}
            alt={photo.caption ?? "Food photo"}
            className="aspect-[4/3] h-full w-full object-cover"
          />
        </figure>
      ))}
    </div>
  );
}
