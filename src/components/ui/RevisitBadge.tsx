import { revisitLabel } from "@/lib/format";
import type { RevisitChoice } from "@/lib/types";

type RevisitBadgeProps = {
  value?: RevisitChoice | null;
};

export function RevisitBadge({ value }: RevisitBadgeProps) {
  const tone =
    value === "Yes"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : value === "Maybe"
        ? "border-sky-200 bg-sky-50 text-sky-800"
        : value === "No"
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-stone-200 bg-white text-stone-500";

  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-sm font-semibold ${tone}`}
    >
      {revisitLabel(value)}
    </span>
  );
}

