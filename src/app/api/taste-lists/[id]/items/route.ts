import { hasSupabasePublicEnv } from "@/lib/env";
import { addTasteListItemSchema } from "@/lib/validators";
import { jsonError, jsonOk } from "@/server/http";
import { assertSameOrigin, requireSecureRouteSession } from "@/server/security";
import { recordAnalyticsEvent } from "@/server/services/analytics";
import type { Restaurant, TasteList } from "@/lib/types";

type TasteListItemRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  context: TasteListItemRouteContext,
) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const { id } = await context.params;
  const json = await request.json().catch(() => null);
  const parsed = addTasteListItemSchema.safeParse(json);

  if (!parsed.success) {
    return jsonError("Invalid list item payload.", 400, {
      issues: parsed.error.flatten(),
    });
  }

  if (!hasSupabasePublicEnv()) {
    return jsonError("Shared lists need Supabase auth to be configured.", 503);
  }

  const session = await requireSecureRouteSession(request);
  if (!session.ok) return session.response;

  const { data: list, error: listError } = await session.supabase
    .from("taste_lists")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (listError) return jsonError(listError.message, 400);
  if (!(list as TasteList | null)) {
    return jsonError("List not found.", 404);
  }

  const { data: restaurant, error: restaurantError } = await session.supabase
    .from("restaurants")
    .select("*")
    .eq("id", parsed.data.restaurant_id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (restaurantError) return jsonError(restaurantError.message, 400);
  const target = restaurant as Restaurant | null;
  if (!target) return jsonError("Restaurant not found.", 404);

  const { data, error } = await session.supabase
    .from("taste_list_items")
    .insert({
      list_id: id,
      added_by: session.user.id,
      restaurant_id: target.id,
      item_title: target.name,
      item_city: target.city,
      item_address: target.address,
      note: parsed.data.note,
    })
    .select("*")
    .single();

  if (error || !data) {
    return jsonError(error?.message ?? "Could not add restaurant to list.", 400);
  }

  await session.supabase
    .from("taste_lists")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", session.user.id);

  await recordAnalyticsEvent({
    supabase: session.supabase,
    userId: session.user.id,
    eventName: "taste_list_item_added",
    metadata: {
      list_id: id,
      item_id: data.id,
      restaurant_id: target.id,
    },
  });

  return jsonOk({ item: data, storage_mode: "supabase" });
}
