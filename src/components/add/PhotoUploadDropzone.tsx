"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { Upload } from "lucide-react";

import { useI18n } from "@/lib/i18n";
import type { PhotoType } from "@/lib/types";

type PhotoUploadKind = Extract<PhotoType, "restaurant" | "dish">;

type PhotoUploadDropzoneProps = {
  disabled?: boolean;
  kind: PhotoUploadKind;
  onFilesSelected: (files: File[], kind: PhotoUploadKind) => void;
};

export function PhotoUploadDropzone({
  disabled = false,
  kind,
  onFilesSelected,
}: PhotoUploadDropzoneProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const titleKey =
    kind === "restaurant"
      ? "photoUpload.restaurantTitle"
      : "photoUpload.dishTitle";
  const descriptionKey =
    kind === "restaurant"
      ? "photoUpload.restaurantDescription"
      : "photoUpload.dishDescription";

  function handleFiles(files: FileList | null) {
    const images = Array.from(files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (images.length > 0) {
      onFilesSelected(images, kind);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      handleFiles(event.dataTransfer.files);
    }
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    handleFiles(event.target.files);
    event.target.value = "";
  }

  return (
    <div className="grid gap-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setIsDragging(true);
          }
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`group grid min-h-[13rem] place-items-center rounded-lg border border-dashed p-5 text-left transition ${
          isDragging
            ? "border-emerald-500 bg-emerald-50"
            : "border-stone-300 bg-white hover:border-stone-400"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <span className="grid max-w-sm justify-items-center gap-4 text-center">
          <span className="grid gap-2">
            <span className="text-xl font-bold text-stone-950">
              {t(titleKey)}
            </span>
            <span className="text-sm leading-6 text-stone-600">
              {t(descriptionKey)}
            </span>
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <Upload aria-hidden="true" className="size-4" />
            {t("photoUpload.upload")}
          </button>
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onInputChange}
        className="sr-only"
      />
    </div>
  );
}
