"use client";

import { Search } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <label className="relative block w-full">
      <span className="sr-only">Search records</span>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
        placeholder="Search restaurants, dishes, cities, tags"
      />
    </label>
  );
}

