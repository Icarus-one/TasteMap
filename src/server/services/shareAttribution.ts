import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShareEventName } from "@/lib/types";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { sanitizeMetadata } from "@/server/services/analytics";

type ShareLinkAttribution = {
  token: string;
  sharerUserId: string;
  restaurantId: string;
};

type ShareLinkRow = {
  token: string;
  user_id: string;
  restaurant_id: string;
};

export async function getShareLinkAttribution(token: string) {
  const admin = createSupabaseAdminClient();
  if (!admin || !isShareToken(token)) return null;

  return getShareLinkAttributionWithClient(admin, token);
}

export async function recordShareAttributionEvent({
  token,
  eventName,
  userId = null,
  visitorId = null,
  toEatItemId = null,
  visitId = null,
  metadata = {},
}: {
  token: string;
  eventName: ShareEventName;
  userId?: string | null;
  visitorId?: string | null;
  toEatItemId?: string | null;
  visitId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const admin = createSupabaseAdminClient();
  if (!admin || !isShareToken(token)) return null;

  const attribution = await getShareLinkAttributionWithClient(admin, token);
  if (!attribution) return null;

  const { error } = await admin.from("share_events").insert({
    token,
    event_name: eventName,
    sharer_user_id: attribution.sharerUserId,
    restaurant_id: attribution.restaurantId,
    user_id: userId,
    visitor_id: visitorId,
    to_eat_item_id: toEatItemId,
    visit_id: visitId,
    metadata: sanitizeMetadata(metadata),
  });

  if (eventName === "share_opened") {
    await admin
      .from("shared_restaurant_links")
      .update({ last_used_at: new Date().toISOString() })
      .eq("token", token);
  }

  if (error && process.env.NODE_ENV !== "production") {
    console.warn("Share attribution event was not recorded:", error.message);
  }

  return attribution;
}

async function getShareLinkAttributionWithClient(
  supabase: SupabaseClient,
  token: string,
): Promise<ShareLinkAttribution | null> {
  const { data } = await supabase
    .from("shared_restaurant_links")
    .select("token, user_id, restaurant_id")
    .eq("token", token)
    .maybeSingle();

  const row = data as ShareLinkRow | null;
  if (!row?.token || !row.user_id || !row.restaurant_id) return null;

  return {
    token: row.token,
    sharerUserId: row.user_id,
    restaurantId: row.restaurant_id,
  };
}

function isShareToken(token: string) {
  return /^[a-f0-9]{36}$/i.test(token);
}
