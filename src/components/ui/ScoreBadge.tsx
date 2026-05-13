import { formatScore } from "@/lib/format";

type ScoreBadgeProps = {
  score?: number | null;
  label?: string;
};

export function ScoreBadge({ score, label = "Score" }: ScoreBadgeProps) {
  const numeric = typeof score === "number" ? score : null;
  const isStarScale = numeric !== null && numeric <= 5;
  const tone =
    numeric === null
      ? "border-stone-200 bg-white text-stone-500"
      : isStarScale
        ? numeric >= 4
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : numeric >= 3
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-rose-200 bg-rose-50 text-rose-800"
        : numeric >= 8
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : numeric >= 6
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-sm font-semibold ${tone}`}
    >
      <span className="text-xs font-medium opacity-70">{label}</span>
      {formatScore(score)}
    </span>
  );
}
