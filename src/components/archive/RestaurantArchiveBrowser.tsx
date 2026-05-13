"use client";

import { useState } from "react";
import { RestaurantCard } from "@/components/cards/RestaurantCard";
import { FilterBar } from "@/components/ui/FilterBar";
import { SearchBar } from "@/components/ui/SearchBar";
import type { RestaurantWithRelations } from "@/lib/types";

type RestaurantArchiveBrowserProps = {
  restaurants: RestaurantWithRelations[];
};

export function RestaurantArchiveBrowser({
  restaurants,
}: RestaurantArchiveBrowserProps) {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState("recent");

  const availableTags = Array.from(
    new Set(restaurants.flatMap((restaurant) => collectRestaurantTags(restaurant))),
  ).sort((left, right) => left.localeCompare(right));

  const filteredRestaurants = [...restaurants]
    .filter((restaurant) => {
      const latestVisit = getLatestVisit(restaurant);
      const restaurantTags = collectRestaurantTags(restaurant);
      const dishText = restaurant.dishes?.map((dish) => dish.name).join(" ") ?? "";
      const reviewText = (restaurant.visits ?? [])
        .flatMap((visit) => [
          visit.summary,
          visit.detailed_review,
          visit.recommended_dishes,
          visit.bad_dishes,
          ...(visit.suitable_scenarios ?? []),
        ])
        .filter(Boolean)
        .join(" ");
      const needle = query.trim().toLowerCase();
      if (!needle && selectedTags.length === 0) return true;
      const searchText = [
        restaurant.name,
        restaurant.city,
        restaurant.address,
        restaurant.cuisine_type,
        restaurantTags.join(" "),
        dishText,
        reviewText,
        latestVisit?.summary,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        (!needle || searchText.includes(needle)) &&
        selectedTags.every((tag) => restaurantTags.includes(tag))
      );
    })
    .sort((a, b) => {
      const latestA = getLatestVisit(a);
      const latestB = getLatestVisit(b);

      if (sort === "score_desc") {
        return Number(latestB?.total_score ?? -1) - Number(latestA?.total_score ?? -1);
      }
      if (sort === "score_asc") {
        return Number(latestA?.total_score ?? 99) - Number(latestB?.total_score ?? 99);
      }
      if (sort === "recommended") {
        return countRestaurantRecommendedVotes(b) - countRestaurantRecommendedVotes(a);
      }
      return String(latestB?.created_at ?? b.created_at).localeCompare(
        String(latestA?.created_at ?? a.created_at),
      );
    });

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <SearchBar value={query} onChange={setQuery} />
        <FilterBar
          selectedTags={selectedTags}
          sort={sort}
          availableTags={availableTags}
          onToggleTag={(tag) =>
            setSelectedTags((current) =>
              current.includes(tag)
                ? current.filter((item) => item !== tag)
                : [...current, tag],
            )
          }
          onSortChange={setSort}
        />
      </section>

      <section className="grid gap-4">
        <div className="grid gap-1">
          <h2 className="text-2xl font-bold text-stone-950">Restaurant archive</h2>
          <p className="text-sm text-stone-500">
            Search by tags, dish names, city, or notes when you want the longer
            view.
          </p>
        </div>
        {filteredRestaurants.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
            No restaurant cards match this search.
          </div>
        )}
      </section>
    </div>
  );
}

function countRestaurantRecommendedVotes(restaurant: RestaurantWithRelations) {
  return restaurant.dishes?.filter((dish) => dish.is_recommended).length ?? 0;
}

function getLatestVisit(restaurant: RestaurantWithRelations) {
  return [...(restaurant.visits ?? [])].sort((a, b) =>
    String(b.created_at).localeCompare(String(a.created_at)),
  )[0];
}

function collectRestaurantTags(restaurant: RestaurantWithRelations) {
  const latestVisit = getLatestVisit(restaurant);
  const values = [
    ...(latestVisit?.suitable_scenarios ?? []),
    restaurant.cuisine_type,
    ...(restaurant.dishes ?? []).map((dish) => dish.cuisine_guess),
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim());

  return Array.from(new Set(values)).slice(0, 8);
}
