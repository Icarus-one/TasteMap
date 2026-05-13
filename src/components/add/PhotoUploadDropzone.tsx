"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { Camera, ImagePlus, Upload } from "lucide-react";

type PhotoUploadDropzoneProps = {
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
};

export function PhotoUploadDropzone({
  disabled = false,
  onFilesSelected,
}: PhotoUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const images = Array.from(files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (images.length > 0) {
      onFilesSelected(images);
    }
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
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
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`group grid min-h-[17rem] place-items-center rounded-lg border border-dashed p-5 text-left transition ${
          isDragging
            ? "border-emerald-500 bg-emerald-50"
            : "border-stone-300 bg-white hover:border-stone-400"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className="grid max-w-sm justify-items-center gap-4 text-center">
          <span className="grid size-16 place-items-center rounded-lg bg-stone-950 text-white shadow-sm">
            <Camera aria-hidden="true" className="size-7" />
          </span>
          <span className="grid gap-2">
            <span className="text-xl font-bold text-stone-950">
              Add food photos first
            </span>
            <span className="text-sm leading-6 text-stone-600">
              Pick from album, take a photo on mobile, or drop multiple images here.
            </span>
          </span>
          <span className="flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700">
              <Upload aria-hidden="true" className="size-4" />
              Upload
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700">
              <ImagePlus aria-hidden="true" className="size-4" />
              Multiple photos
            </span>
          </span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={onInputChange}
        className="sr-only"
      />
    </div>
  );
}
