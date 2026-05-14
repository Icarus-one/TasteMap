import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { Photo, RestaurantWithRelations, VisitWithRelations } from "@/lib/types";

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

export async function getSharedRestaurantById(id: string) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("restaurants")
    .select("*, visits(*, dishes(*), photos(*)), dishes(*), photos(*)")
    .eq("id", id)
    .single();

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
    .select("restaurant_id")
    .eq("token", token)
    .maybeSingle();

  if (!share?.restaurant_id) {
    return null;
  }

  await supabase
    .from("shared_restaurant_links")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token", token);

  return getSharedRestaurantById(share.restaurant_id);
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
