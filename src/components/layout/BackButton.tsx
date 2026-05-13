"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      title="Go back"
      className="inline-flex size-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
    >
      <ChevronLeft aria-hidden="true" className="size-4" />
    </button>
  );
}
