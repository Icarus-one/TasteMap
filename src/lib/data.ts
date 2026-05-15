import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { demoRestaurants, demoToEatItems, demoVisits } from "@/lib/demoData";
import { ensureProfileFromUser, isProfileComplete } from "@/lib/profile";
import type {
  Photo,
  Profile,
  RestaurantWithRelations,
  ToEatItem,
  VisitWithRelations,
} from "@/lib/types";
import {
  getLocalDashboardData,
  getLocalRestaurantById,
  getLocalToEatItemById,
  getLocalVisitById,
} from "@/server/localStore";

type PhotoStorageClient = {
  storage: {
    from: (bucket: string) => {
      createSignedUrl: (
        path: string,
        expiresIn: number,
      ) => Promise<{
        data: { signedUrl: string } | null;
        error: unknown;
      }>;
    };
  };
};

export async function getSessionContext(options?: {
  protect?: boolean;
  skipProfileSetup?: boolean;
}) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      configured: false,
      supabase: null,
      user: null,
      profile: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && options?.protect) {
    redirect("/login");
  }

  const profile = user ? await ensureProfileFromUser(supabase, user) : null;

  if (
    user &&
    options?.protect &&
    !options.skipProfileSetup &&
    !isProfileComplete(profile)
  ) {
    redirect("/profile/setup");
  }

  return {
    configured: true,
    supabase,
    user,
    profile,
  };
}

export async function getDashboardData() {
  const context = await getSessionContext({ protect: true });

  if (!context.configured || !context.supabase || !context.user) {
    const local = await getLocalDashboardData();
    const hasLocalData =
      local.restaurants.length > 0 ||
      local.visits.length > 0 ||
      local.toEatItems.length > 0;

    return {
      configured: false,
      restaurants: hasLocalData ? local.restaurants : demoRestaurants,
      visits: hasLocalData ? local.visits : demoVisits,
      toEatItems: hasLocalData ? local.toEatItems : demoToEatItems,
      profile: null,
    };
  }

  const [restaurantsResult, visitsResult, toEatItemsResult] = await Promise.all([
    context.supabase
      .from("restaurants")
      .select("*, visits(*), dishes(*), photos(*)")
      .eq("user_id", context.user.id)
      .order("updated_at", { ascending: false }),
    context.supabase
      .from("visits")
      .select("*, restaurants(*), dishes(*), photos(*)")
      .eq("user_id", context.user.id)
      .order("created_at", { ascending: false }),
    context.supabase
      .from("to_eat_items")
      .select("*")
      .eq("user_id", context.user.id)
      .order("created_at", { ascending: false }),
  ]);

  const restaurants =
    (restaurantsResult.data as RestaurantWithRelations[] | null) ?? [];
  const visits = (visitsResult.data as VisitWithRelations[] | null) ?? [];
  const toEatItems = (toEatItemsResult.data as ToEatItem[] | null) ?? [];

  return {
    configured: true,
    restaurants: await Promise.all(
      restaurants.map((restaurant) =>
        hydrateRestaurantPhotos(context.supabase, restaurant),
      ),
    ),
    visits: await Promise.all(
      visits.map((visit) => hydrateVisitPhotos(context.supabase, visit)),
    ),
    toEatItems,
    profile: context.profile as Profile | null,
  };
}

export async function getRestaurantById(id: string) {
  const context = await getSessionContext({ protect: true });

  if (!context.configured || !context.supabase || !context.user) {
    const localRestaurant = await getLocalRestaurantById(id);
    return (
      localRestaurant ??
      demoRestaurants.find((restaurant) => restaurant.id === id) ??
      null
    );
  }

  const { data } = await context.supabase
    .from("restaurants")
    .select("*, visits(*, dishes(*), photos(*)), dishes(*), photos(*)")
    .eq("id", id)
    .eq("user_id", context.user.id)
    .single();

  const restaurant = (data as RestaurantWithRelations | null) ?? null;
  return restaurant
    ? hydrateRestaurantPhotos(context.supabase, restaurant)
    : null;
}

export async function getVisitById(id: string) {
  const context = await getSessionContext({ protect: true });

  if (!context.configured || !context.supabase || !context.user) {
    const localVisit = await getLocalVisitById(id);
    return localVisit ?? demoVisits.find((visit) => visit.id === id) ?? null;
  }

  const { data } = await context.supabase
    .from("visits")
    .select("*, restaurants(*), dishes(*), photos(*)")
    .eq("id", id)
    .eq("user_id", context.user.id)
    .single();

  const visit = (data as VisitWithRelations | null) ?? null;
  return visit ? hydrateVisitPhotos(context.supabase, visit) : null;
}

export async function getToEatItemById(id: string) {
  const context = await getSessionContext({ protect: true });

  if (!context.configured || !context.supabase || !context.user) {
    const localItem = await getLocalToEatItemById(id);
    return localItem ?? demoToEatItems.find((item) => item.id === id) ?? null;
  }

  const { data } = await context.supabase
    .from("to_eat_items")
    .select("*")
    .eq("id", id)
    .eq("user_id", context.user.id)
    .single();

  return (data as ToEatItem | null) ?? null;
}

export async function getAvailableVisitTags() {
  const context = await getSessionContext({ protect: true });

  if (!context.configured || !context.supabase || !context.user) {
    const local = await getLocalDashboardData();
    return collectUniqueTags(local.visits);
  }

  const { data } = await context.supabase
    .from("visits")
    .select("suitable_scenarios")
    .eq("user_id", context.user.id)
    .order("created_at", { ascending: false });

  return collectUniqueTags((data as Array<{ suitable_scenarios?: string[] | null }> | null) ?? []);
}

async function hydrateRestaurantPhotos(
  supabase: PhotoStorageClient,
  restaurant: RestaurantWithRelations,
): Promise<RestaurantWithRelations> {
  const visits = await Promise.all(
    (restaurant.visits ?? []).map((visit) => hydrateVisitPhotos(supabase, visit)),
  );

  return {
    ...restaurant,
    visits,
    photos: await signPhotoUrls(supabase, restaurant.photos),
  };
}

async function hydrateVisitPhotos(
  supabase: PhotoStorageClient,
  visit: VisitWithRelations,
): Promise<VisitWithRelations> {
  return {
    ...visit,
    photos: await signPhotoUrls(supabase, visit.photos),
  };
}

async function signPhotoUrls(
  supabase: PhotoStorageClient,
  photos?: Photo[] | null,
): Promise<Photo[]> {
  return Promise.all(
    (photos ?? []).map(async (photo) => {
      const { data } = await supabase.storage
        .from("food-photos")
        .createSignedUrl(photo.storage_path, 60 * 60);

      return {
        ...photo,
        display_url: data?.signedUrl ?? photo.public_url ?? null,
      };
    }),
  );
}

function collectUniqueTags(
  visits: Array<{ suitable_scenarios?: string[] | null }>,
) {
  return Array.from(
    new Set(
      visits
        .flatMap((visit) => visit.suitable_scenarios ?? [])
        .filter((tag): tag is string => Boolean(tag?.trim()))
        .map((tag) => tag.trim()),
    ),
  ).sort((left, right) => left.localeCompare(right));
}
