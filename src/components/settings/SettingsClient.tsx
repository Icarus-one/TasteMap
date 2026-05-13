"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function SettingsClient() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  async function exportJson() {
    setIsWorking(true);
    setMessage(null);
    const response = await fetch("/api/export-data");
    setIsWorking(false);

    if (!response.ok) {
      setMessage("Export failed.");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tastemap-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("JSON export ready.");
  }

  async function deleteAllData() {
    const confirmed = window.confirm(
      "Delete all restaurants, visits, dishes, and photos in this account?",
    );
    if (!confirmed) return;

    setIsWorking(true);
    setMessage(null);
    const response = await fetch("/api/delete-all-data", { method: "DELETE" });
    setIsWorking(false);

    if (!response.ok) {
      setMessage("Delete failed.");
      return;
    }

    setMessage("All private records were deleted.");
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      {message ? (
        <p className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
          {message}
        </p>
      ) : null}
      <button
        type="button"
        disabled={isWorking}
        onClick={exportJson}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
      >
        <Download aria-hidden="true" className="size-4" />
        Export JSON
      </button>
      <button
        type="button"
        disabled={isWorking}
        onClick={deleteAllData}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 disabled:opacity-60"
      >
        <Trash2 aria-hidden="true" className="size-4" />
        Delete all data
      </button>
    </div>
  );
}
