import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnalyticsEventName } from "@/lib/types";

type AnalyticsMetadata = Record<string, unknown>;

export const coreAnalyticsEvents: AnalyticsEventName[] = [
  "photo_analyzed",
  "to_eat_link_analyzed",
  "nearby_restaurants_searched",
  "restaurant_match_searched",
  "visit_created",
  "restaurant_opened",
  "visit_opened",
  "to_eat_item_opened",
  "to_eat_item_created",
  "to_eat_item_converted",
  "share_clicked",
  "share_link_created",
  "friend_request_sent",
  "friend_request_accepted",
  "taste_list_created",
  "taste_list_item_added",
  "friend_card_sent",
];

export async function recordAnalyticsEvent({
  supabase,
  userId,
  eventName,
  path = null,
  sessionId = null,
  metadata = {},
}: {
  supabase: SupabaseClient;
  userId: string;
  eventName: AnalyticsEventName;
  path?: string | null;
  sessionId?: string | null;
  metadata?: AnalyticsMetadata;
}) {
  const { error } = await supabase.from("analytics_events").insert({
    user_id: userId,
    event_name: eventName,
    path,
    session_id: sessionId,
    metadata: sanitizeMetadata(metadata),
  });

  if (error && process.env.NODE_ENV !== "production") {
    console.warn("Analytics event was not recorded:", error.message);
  }
}

export function sanitizeMetadata(metadata: AnalyticsMetadata) {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, normalizeMetadataValue(value)]),
  );
}

function normalizeMetadataValue(value: unknown): unknown {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 30).map(normalizeMetadataValue);
  }

  if (typeof value === "object" && value) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 30)
        .map(([key, nested]) => [key, normalizeMetadataValue(nested)]),
    );
  }

  return String(value);
}
