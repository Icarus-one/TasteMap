"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { Camera, ImagePlus } from "lucide-react";

import { useI18n } from "@/lib/i18n";

type PhotoUploadDropzoneProps = {
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
};

export function PhotoUploadDropzone({
  disabled = false,
  onFilesSelected,
}: PhotoUploadDropzoneProps) {
  const { t } = useI18n();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const images = Array.from(files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (images.length > 0) {
      onFilesSelected(images);
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
        className={`group grid min-h-[17rem] place-items-center rounded-lg border border-dashed p-5 text-left transition ${
          isDragging
            ? "border-emerald-500 bg-emerald-50"
            : "border-stone-300 bg-white hover:border-stone-400"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <span className="grid max-w-sm justify-items-center gap-4 text-center">
          <span className="grid size-16 place-items-center rounded-lg bg-stone-950 text-white shadow-sm">
            <Camera aria-hidden="true" className="size-7" />
          </span>
          <span className="grid gap-2">
            <span className="text-xl font-bold text-stone-950">
              {t("photoUpload.title")}
            </span>
            <span className="text-sm leading-6 text-stone-600">
              {t("photoUpload.description")}
            </span>
          </span>
          <span className="grid w-full gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Camera aria-hidden="true" className="size-4" />
              {t("photoUpload.takePhoto")}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => albumInputRef.current?.click()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ImagePlus aria-hidden="true" className="size-4" />
              {t("photoUpload.chooseAlbum")}
            </button>
          </span>
        </span>
      </div>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onInputChange}
        className="sr-only"
      />
      <input
        ref={albumInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onInputChange}
        className="sr-only"
      />
    </div>
  );
}
