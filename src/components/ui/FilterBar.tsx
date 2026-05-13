"use client";

type FilterBarProps = {
  selectedTags: string[];
  sort: string;
  availableTags: string[];
  onToggleTag: (value: string) => void;
  onSortChange: (value: string) => void;
};

export function FilterBar({
  selectedTags,
  sort,
  availableTags,
  onToggleTag,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
        <span>Tags</span>
        <div className="flex flex-wrap gap-2 rounded-lg border border-stone-200 bg-white p-3">
          {availableTags.length > 0 ? (
            availableTags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleTag(tag)}
                  className={`rounded-lg border px-2.5 py-1 text-sm font-medium normal-case transition ${
                    active
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300"
                  }`}
                >
                  {tag}
                </button>
              );
            })
          ) : (
            <span className="text-sm font-medium normal-case text-stone-500">
              No tags yet
            </span>
          )}
        </div>
      </div>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
        Sort
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
          className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium normal-case text-stone-800 outline-none focus:border-stone-500"
        >
          <option value="recent">Newest logs</option>
          <option value="score_desc">Highest stars</option>
          <option value="score_asc">Lowest stars</option>
          <option value="recommended">Most recommended dishes</option>
        </select>
      </label>
    </div>
  );
}
