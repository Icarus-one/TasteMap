import { randomBytes } from "crypto";
import { getAppUrl } from "@/lib/env";
import { jsonError, jsonOk } from "@/server/http";
import { requireSecureRouteSession } from "@/server/security";
import { recordAnalyticsEvent } from "@/server/services/analytics";

type ShareRestaurantRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  context: ShareRestaurantRouteContext,
) {
  const session = await requireSecureRouteSession(request);
  if (!session.ok) {
    return session.response;
  }

  const { id } = await context.params;
  const { data: restaurant } = await session.supabase
    .from("restaurants")
    .select("id")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (!restaurant) {
    return jsonError("Restaurant not found.", 404);
  }

  const { data: existing } = await session.supabase
    .from("shared_restaurant_links")
    .select("token")
    .eq("user_id", session.user.id)
    .eq("restaurant_id", id)
    .maybeSingle();

  if (existing?.token) {
    await recordAnalyticsEvent({
      supabase: session.supabase,
      userId: session.user.id,
      eventName: "share_link_created",
      path: `/restaurants/${id}`,
      metadata: { restaurant_id: id, reused_existing_link: true },
    });

    return jsonOk({
      url: new URL(`/share/restaurants/${existing.token}`, getAppUrl()).toString(),
    });
  }

  const { data, error } = await session.supabase
    .from("shared_restaurant_links")
    .insert({
      user_id: session.user.id,
      restaurant_id: id,
      token: randomBytes(18).toString("hex"),
    })
    .select("token")
    .single();

  if (error || !data?.token) {
    return jsonError(error?.message ?? "Could not create share link.", 500);
  }

  await recordAnalyticsEvent({
    supabase: session.supabase,
    userId: session.user.id,
    eventName: "share_link_created",
    path: `/restaurants/${id}`,
    metadata: { restaurant_id: id, reused_existing_link: false },
  });

  return jsonOk({
    url: new URL(`/share/restaurants/${data.token}`, getAppUrl()).toString(),
  });
}
