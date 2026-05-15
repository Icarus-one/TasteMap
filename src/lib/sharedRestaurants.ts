import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type {
  Photo,
  Profile,
  RestaurantWithRelations,
  VisitWithRelations,
} from "@/lib/types";

export type SharedRestaurantPayload = {
  restaurant: RestaurantWithRelations;
  sharer: Profile | null;
};

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

export async function getSharedRestaurantById(id: string, ownerId?: string) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  let query = supabase
    .from("restaurants")
    .select("*, visits(*, dishes(*), photos(*)), dishes(*), photos(*)")
    .eq("id", id);

  if (ownerId) {
    query = query.eq("user_id", ownerId);
  }

  const { data } = await query.single();

  const restaurant = (data as RestaurantWithRelations | null) ?? null;

  if (!restaurant) {
    return null;
  }

  return hydrateRestaurantPhotos(supabase, restaurant);
}

export async function getSharedRestaurantByToken(token: string) {
  if (!/^[a-f0-9]{36}$/i.test(token)) {
    return null;
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data: share } = await supabase
    .from("shared_restaurant_links")
    .select("restaurant_id, user_id")
    .eq("token", token)
    .maybeSingle();

  if (!share?.restaurant_id || !share.user_id) {
    return null;
  }

  await supabase
    .from("shared_restaurant_links")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token", token);

  const [restaurant, profileResult] = await Promise.all([
    getSharedRestaurantById(share.restaurant_id, share.user_id),
    supabase.from("profiles").select("*").eq("id", share.user_id).maybeSingle(),
  ]);

  if (!restaurant) return null;

  return {
    restaurant,
    sharer: (profileResult.data as Profile | null) ?? null,
  } satisfies SharedRestaurantPayload;
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
