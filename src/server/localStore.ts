import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type {
  Dish,
  Photo,
  Restaurant,
  RestaurantAlias,
  RestaurantMatchCandidate,
  RestaurantWithRelations,
  ToEatItem,
  Visit,
  VisitWithRelations,
} from "@/lib/types";
import {
  buildRestaurantMatchCandidates,
  normalizeRestaurantName,
} from "@/server/restaurantIdentity";
import type { CreateVisitInput } from "@/server/services/visitRecords";

type LocalDb = {
  restaurants: Restaurant[];
  restaurantAliases: RestaurantAlias[];
  visits: Visit[];
  dishes: Dish[];
  photos: Photo[];
  toEatItems: ToEatItem[];
};

const LOCAL_DB_DIR = path.join(process.cwd(), ".tastemap");
const LOCAL_DB_PATH = path.join(LOCAL_DB_DIR, "local-db.json");
const LOCAL_USER_ID = "local-user";

export async function createLocalVisitFromPhotoRecord(input: CreateVisitInput) {
  const db = await readLocalDb();
  const now = new Date().toISOString();

  const restaurant = resolveLocalRestaurant(db, input, now);

  const visitId = randomUUID();
  const visit: Visit = {
    id: visitId,
    user_id: LOCAL_USER_ID,
    restaurant_id: restaurant.id,
    visit_date: input.visit.visit_date ?? null,
    taken_at: input.visit.taken_at ?? null,
    companions: null,
    average_price: input.visit.average_price ?? null,
    total_score: input.visit.total_score,
    taste_score: null,
    environment_score: null,
    service_score: null,
    value_score: null,
    will_revisit: input.visit.will_revisit,
    summary: input.visit.summary ?? null,
    detailed_review: input.visit.detailed_review ?? null,
    recommended_dishes: summarizeDishVotes(input.dishes, "recommended"),
    bad_dishes: summarizeDishVotes(input.dishes, "bad"),
    suitable_scenarios: input.visit.tags ?? [],
    location_source: input.visit.location_source,
    location_confidence: confidenceForLocation(input.visit.location_source),
    restaurant_match_source: input.visit.restaurant_match_source,
    ai_generated:
      input.photos.some((photo) => photo.ai_analysis_json) ||
      input.dishes.some((dish) => dish.name_ai_guess),
    user_confirmed: true,
    created_at: now,
    updated_at: now,
  };

  const dishes: Dish[] = input.dishes.map((dish) => ({
    id: randomUUID(),
    user_id: LOCAL_USER_ID,
    restaurant_id: restaurant.id,
    visit_id: visit.id,
    name: dish.name,
    name_ai_guess: dish.name_ai_guess ?? null,
    cuisine_guess: dish.cuisine_guess ?? null,
    category: dish.category ?? null,
    visible_ingredients: dish.visible_ingredients ?? [],
    score: null,
    price: null,
    currency: null,
    is_recommended: dish.is_recommended ?? false,
    is_bad: dish.is_bad ?? false,
    comment: null,
    ai_confidence: dish.ai_confidence,
    user_confirmed: dish.user_confirmed,
    created_at: now,
    updated_at: now,
  }));

  const firstDishId = dishes[0]?.id ?? null;
  const photos: Photo[] = input.photos.map((photo) => ({
    id: randomUUID(),
    user_id: LOCAL_USER_ID,
    restaurant_id: restaurant.id,
    visit_id: visit.id,
    dish_id: firstDishId,
    storage_path: photo.storage_path,
    public_url: photo.public_url ?? null,
    display_url: photo.public_url ?? null,
    photo_type: photo.photo_type,
    caption: null,
    taken_at: photo.taken_at ?? null,
    exif_exists: photo.exif_exists ?? false,
    exif_latitude: photo.exif_latitude ?? null,
    exif_longitude: photo.exif_longitude ?? null,
    location_source: photo.location_source,
    ai_analysis_json: (photo.ai_analysis_json as Photo["ai_analysis_json"]) ?? null,
    ai_detected_dishes: extractDetectedDishes(photo.ai_analysis_json),
    ai_confidence: photo.ai_confidence,
    created_at: now,
  }));

  db.restaurants = upsertRestaurant(db.restaurants, {
    ...restaurant,
    updated_at: now,
  });
  upsertLocalRestaurantAlias({
    db,
    restaurantId: restaurant.id,
    aliasName: input.restaurant.input_name ?? input.restaurant.name,
    canonicalName: restaurant.name,
    source: input.restaurant.mode === "provider" ? "places_api" : "user_input",
    createdAt: now,
  });
  db.visits.unshift(visit);
  db.dishes.unshift(...dishes);
  db.photos.unshift(...photos);

  await writeLocalDb(db);

  return {
    visitId: visit.id,
    restaurantId: restaurant.id,
  };
}

export async function searchLocalRestaurantMatches(query: {
  name: string;
  city?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  provider_place_id?: string | null;
}): Promise<RestaurantMatchCandidate[]> {
  const db = await readLocalDb();
  const aliasesByRestaurant = groupAliasesByRestaurant(db.restaurantAliases);

  return buildRestaurantMatchCandidates({
    query,
    restaurants: db.restaurants.map((restaurant) => ({
      ...restaurant,
      aliases: aliasesByRestaurant.get(restaurant.id) ?? [],
    })),
  });
}

export async function getLocalDashboardData() {
  const db = await readLocalDb();

  return {
    restaurants: db.restaurants
      .slice()
      .sort(byNewest("updated_at"))
      .map((restaurant) => buildRestaurantWithRelations(db, restaurant)),
    visits: db.visits
      .slice()
      .sort(byNewest("created_at"))
      .map((visit) => buildVisitWithRelations(db, visit)),
    toEatItems: db.toEatItems.slice().sort(byNewest("created_at")),
  };
}

export async function getLocalRestaurantById(id: string) {
  const db = await readLocalDb();
  const restaurant = db.restaurants.find((item) => item.id === id);
  return restaurant ? buildRestaurantWithRelations(db, restaurant) : null;
}

export async function getLocalVisitById(id: string) {
  const db = await readLocalDb();
  const visit = db.visits.find((item) => item.id === id);
  return visit ? buildVisitWithRelations(db, visit) : null;
}

export async function getLocalToEatItemById(id: string) {
  const db = await readLocalDb();
  return db.toEatItems.find((item) => item.id === id) ?? null;
}

export async function updateLocalRestaurant({
  id,
  input,
}: {
  id: string;
  input: {
    name: string;
    city?: string | null;
    address?: string | null;
  };
}) {
  const db = await readLocalDb();
  const restaurant = db.restaurants.find((item) => item.id === id);
  if (!restaurant) {
    return { error: "Restaurant not found." as const };
  }

  const updatedRestaurant: Restaurant = {
    ...restaurant,
    name: input.name,
    city: input.city ?? null,
    address: input.address ?? null,
    updated_at: new Date().toISOString(),
  };

  db.restaurants = upsertRestaurant(db.restaurants, updatedRestaurant);
  await writeLocalDb(db);

  return { restaurant: updatedRestaurant };
}

export async function deleteLocalRestaurant(id: string) {
  const db = await readLocalDb();
  const restaurant = db.restaurants.find((item) => item.id === id);
  if (!restaurant) {
    return { error: "Restaurant not found." as const };
  }

  const visitIds = db.visits
    .filter((visit) => visit.restaurant_id === id)
    .map((visit) => visit.id);

  db.restaurants = db.restaurants.filter((item) => item.id !== id);
  db.restaurantAliases = db.restaurantAliases.filter(
    (alias) => alias.restaurant_id !== id,
  );
  db.visits = db.visits.filter((visit) => visit.restaurant_id !== id);
  db.dishes = db.dishes.filter((dish) => dish.restaurant_id !== id);
  db.photos = db.photos.filter(
    (photo) => photo.restaurant_id !== id && !visitIds.includes(photo.visit_id ?? ""),
  );

  await writeLocalDb(db);

  return { ok: true as const };
}

export async function createLocalToEatItem(input: {
  title: string;
  source_url?: string | null;
  source_image_url?: string | null;
  source_platform: ToEatItem["source_platform"];
  source_creator?: string | null;
  restaurant_name?: string | null;
  city?: string | null;
  address?: string | null;
  cuisine_type?: string | null;
  note?: string | null;
  tags?: string[] | null;
  priority?: number | null;
  status?: ToEatItem["status"];
  shareable?: boolean;
}) {
  const db = await readLocalDb();
  const now = new Date().toISOString();

  const item: ToEatItem = {
    id: randomUUID(),
    user_id: LOCAL_USER_ID,
    title: input.title,
    source_url: input.source_url ?? null,
    source_image_url: input.source_image_url ?? null,
    source_platform: input.source_platform,
    source_creator: input.source_creator ?? null,
    restaurant_name: input.restaurant_name ?? null,
    city: input.city ?? null,
    address: input.address ?? null,
    cuisine_type: input.cuisine_type ?? null,
    note: input.note ?? null,
    tags: input.tags ?? [],
    priority: input.priority ?? 3,
    status: input.status ?? "to_eat",
    shareable: input.shareable ?? false,
    linked_restaurant_id: null,
    linked_visit_id: null,
    created_at: now,
    updated_at: now,
  };

  db.toEatItems.unshift(item);
  await writeLocalDb(db);

  return { item };
}

export async function updateLocalToEatItem({
  id,
  input,
}: {
  id: string;
  input: Partial<
    Pick<
      ToEatItem,
      | "title"
      | "source_url"
      | "source_image_url"
      | "source_platform"
      | "source_creator"
      | "restaurant_name"
      | "city"
      | "address"
      | "cuisine_type"
      | "note"
      | "tags"
      | "priority"
      | "status"
      | "shareable"
      | "linked_restaurant_id"
      | "linked_visit_id"
    >
  >;
}) {
  const db = await readLocalDb();
  const index = db.toEatItems.findIndex((item) => item.id === id);
  if (index === -1) {
    return { error: "To-do item not found." as const };
  }

  const current = db.toEatItems[index];
  const item: ToEatItem = {
    ...current,
    ...input,
    updated_at: new Date().toISOString(),
  };

  db.toEatItems[index] = item;
  await writeLocalDb(db);

  return { item };
}

export async function deleteLocalToEatItem(id: string) {
  const db = await readLocalDb();
  const exists = db.toEatItems.some((item) => item.id === id);
  if (!exists) {
    return { error: "To-do item not found." as const };
  }

  db.toEatItems = db.toEatItems.filter((item) => item.id !== id);
  await writeLocalDb(db);

  return { ok: true as const };
}

export async function exportLocalArchive() {
  const db = await readLocalDb();
  return {
    exported_at: new Date().toISOString(),
    storage_mode: "local",
    user_id: LOCAL_USER_ID,
    restaurants: db.restaurants,
    restaurant_aliases: db.restaurantAliases,
    visits: db.visits,
    dishes: db.dishes,
    photos: db.photos,
    place_candidates: [],
    to_eat_items: db.toEatItems,
  };
}

export async function deleteLocalArchive() {
  await writeLocalDb(emptyDb());
  return { ok: true as const };
}

async function readLocalDb(): Promise<LocalDb> {
  try {
    const raw = await readFile(LOCAL_DB_PATH, "utf8");
    return normalizeDb(JSON.parse(raw) as Partial<LocalDb>);
  } catch {
    return emptyDb();
  }
}

async function writeLocalDb(db: LocalDb) {
  await mkdir(LOCAL_DB_DIR, { recursive: true });
  await writeFile(LOCAL_DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function emptyDb(): LocalDb {
  return {
    restaurants: [],
    restaurantAliases: [],
    visits: [],
    dishes: [],
    photos: [],
    toEatItems: [],
  };
}

function normalizeDb(raw: Partial<LocalDb>): LocalDb {
  return {
    restaurants: Array.isArray(raw.restaurants) ? raw.restaurants : [],
    restaurantAliases: Array.isArray(raw.restaurantAliases)
      ? raw.restaurantAliases
      : Array.isArray((raw as { restaurant_aliases?: unknown }).restaurant_aliases)
        ? ((raw as { restaurant_aliases: RestaurantAlias[] }).restaurant_aliases ??
          [])
        : [],
    visits: Array.isArray(raw.visits) ? raw.visits : [],
    dishes: Array.isArray(raw.dishes) ? raw.dishes : [],
    photos: Array.isArray(raw.photos) ? raw.photos : [],
    toEatItems: Array.isArray(raw.toEatItems) ? raw.toEatItems : [],
  };
}

function resolveLocalRestaurant(
  db: LocalDb,
  input: CreateVisitInput,
  now: string,
): Restaurant {
  const derivedCuisineType =
    input.restaurant.cuisine_type ?? deriveCuisineTypeFromDishes(input.dishes) ?? null;

  const existingById =
    input.restaurant.mode === "existing" && input.restaurant.restaurant_id
      ? db.restaurants.find((restaurant) => restaurant.id === input.restaurant.restaurant_id)
      : null;

  if (existingById) {
    return {
      ...existingById,
      name: input.restaurant.name || existingById.name,
      address: input.restaurant.address ?? existingById.address,
      city: input.restaurant.city ?? existingById.city,
      country: input.restaurant.country ?? existingById.country,
      latitude: input.restaurant.latitude ?? existingById.latitude,
      longitude: input.restaurant.longitude ?? existingById.longitude,
      cuisine_type: derivedCuisineType ?? existingById.cuisine_type,
      provider_place_id:
        input.restaurant.provider_place_id ?? existingById.provider_place_id,
      provider_name: input.restaurant.provider_name ?? existingById.provider_name,
      updated_at: now,
    };
  }

  const existingByProvider =
    input.restaurant.provider_place_id
      ? db.restaurants.find(
          (restaurant) =>
            restaurant.provider_place_id === input.restaurant.provider_place_id,
        )
      : null;

  if (existingByProvider) {
    return {
      ...existingByProvider,
      name: input.restaurant.name || existingByProvider.name,
      address: input.restaurant.address ?? existingByProvider.address,
      city: input.restaurant.city ?? existingByProvider.city,
      country: input.restaurant.country ?? existingByProvider.country,
      latitude: input.restaurant.latitude ?? existingByProvider.latitude,
      longitude: input.restaurant.longitude ?? existingByProvider.longitude,
      cuisine_type: derivedCuisineType ?? existingByProvider.cuisine_type,
      provider_name:
        input.restaurant.provider_name ?? existingByProvider.provider_name,
      updated_at: now,
    };
  }

  return {
    id: randomUUID(),
    user_id: LOCAL_USER_ID,
    name: input.restaurant.name,
    city: input.restaurant.city ?? null,
    country: input.restaurant.country ?? null,
    address: input.restaurant.address ?? null,
    latitude: input.restaurant.latitude ?? null,
    longitude: input.restaurant.longitude ?? null,
    cuisine_type: derivedCuisineType,
    average_price: null,
    currency: null,
    provider_place_id: input.restaurant.provider_place_id ?? null,
    provider_name:
      input.restaurant.provider_name ??
      (input.restaurant.mode === "provider" ? "places_api" : null),
    created_at: now,
    updated_at: now,
  };
}

function upsertRestaurant(restaurants: Restaurant[], next: Restaurant) {
  const existingIndex = restaurants.findIndex((restaurant) => restaurant.id === next.id);

  if (existingIndex === -1) {
    return [next, ...restaurants];
  }

  const updated = restaurants.slice();
  updated[existingIndex] = next;
  return updated;
}

function upsertLocalRestaurantAlias({
  db,
  restaurantId,
  aliasName,
  canonicalName,
  source,
  createdAt,
}: {
  db: LocalDb;
  restaurantId: string;
  aliasName?: string | null;
  canonicalName?: string | null;
  source: RestaurantAlias["source"];
  createdAt: string;
}) {
  const trimmedAlias = aliasName?.trim();
  if (!trimmedAlias) return;

  const normalizedAlias = normalizeRestaurantName(trimmedAlias);
  const normalizedCanonical = normalizeRestaurantName(canonicalName);
  if (!normalizedAlias || normalizedAlias === normalizedCanonical) return;

  const alreadyExists = db.restaurantAliases.some(
    (alias) =>
      alias.restaurant_id === restaurantId &&
      alias.normalized_alias_name === normalizedAlias,
  );

  if (alreadyExists) return;

  db.restaurantAliases.unshift({
    id: randomUUID(),
    user_id: LOCAL_USER_ID,
    restaurant_id: restaurantId,
    alias_name: trimmedAlias,
    normalized_alias_name: normalizedAlias,
    source,
    created_at: createdAt,
  });
}

function groupAliasesByRestaurant(aliases: RestaurantAlias[]) {
  const map = new Map<string, RestaurantAlias[]>();

  aliases.forEach((alias) => {
    const items = map.get(alias.restaurant_id) ?? [];
    items.push(alias);
    map.set(alias.restaurant_id, items);
  });

  return map;
}

function buildRestaurantWithRelations(
  db: LocalDb,
  restaurant: Restaurant,
): RestaurantWithRelations {
  const baseRestaurant: Restaurant = { ...restaurant };
  const visits = db.visits
    .filter((visit) => visit.restaurant_id === restaurant.id)
    .sort(byNewest("created_at"))
    .map((visit) => buildVisitWithRelations(db, visit, baseRestaurant));

  const dishes = db.dishes.filter((dish) => dish.restaurant_id === restaurant.id);
  const photos = db.photos
    .filter((photo) => photo.restaurant_id === restaurant.id)
    .map(withDisplayUrl);

  return {
    ...baseRestaurant,
    visits,
    dishes,
    photos,
  };
}

function buildVisitWithRelations(
  db: LocalDb,
  visit: Visit,
  restaurantOverride?: Restaurant,
): VisitWithRelations {
  const restaurant =
    restaurantOverride ??
    db.restaurants.find((item) => item.id === visit.restaurant_id) ??
    null;

  return {
    ...visit,
    restaurants: restaurant,
    dishes: db.dishes.filter((dish) => dish.visit_id === visit.id),
    photos: db.photos
      .filter((photo) => photo.visit_id === visit.id)
      .map(withDisplayUrl),
  };
}

function withDisplayUrl(photo: Photo): Photo {
  return {
    ...photo,
    display_url: photo.public_url ?? photo.display_url ?? null,
  };
}

function confidenceForLocation(source: CreateVisitInput["visit"]["location_source"]) {
  if (source === "exif") return "high" as const;
  if (source === "device") return "medium" as const;
  if (source === "manual") return "low" as const;
  return "unknown" as const;
}

function summarizeDishVotes(
  dishes: Array<{
    name: string;
    is_recommended?: boolean;
    is_bad?: boolean;
  }>,
  mode: "recommended" | "bad",
) {
  const selected = dishes
    .filter((dish) =>
      mode === "recommended" ? dish.is_recommended : dish.is_bad,
    )
    .map((dish) => dish.name.trim())
    .filter(Boolean);

  return selected.length > 0 ? selected.join(", ") : null;
}

function deriveCuisineTypeFromDishes(
  dishes: Array<{ cuisine_guess?: string | null }>,
) {
  const counts = new Map<string, number>();

  dishes.forEach((dish) => {
    const cuisine = dish.cuisine_guess?.trim();
    if (!cuisine) return;
    counts.set(cuisine, (counts.get(cuisine) ?? 0) + 1);
  });

  let winner: string | null = null;
  let best = 0;
  counts.forEach((count, cuisine) => {
    if (count > best) {
      best = count;
      winner = cuisine;
    }
  });

  return winner;
}

function extractDetectedDishes(value: unknown) {
  if (value && typeof value === "object" && "detectedDishes" in value) {
    return value.detectedDishes;
  }
  return null;
}

function byNewest<Key extends "created_at" | "updated_at">(key: Key) {
  return <T extends Record<Key, string>>(a: T, b: T) =>
    new Date(b[key]).getTime() - new Date(a[key]).getTime();
}
