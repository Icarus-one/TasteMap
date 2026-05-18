import { hasSupabasePublicEnv } from "@/lib/env";
import { jsonOk } from "@/server/http";
import { exportLocalArchive } from "@/server/localStore";
import { assertSameOrigin, requireSecureRouteSession } from "@/server/security";
import { recordAnalyticsEvent } from "@/server/services/analytics";
import { exportUserArchive } from "@/server/services/userArchive";

export async function GET(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  if (!hasSupabasePublicEnv()) {
    const payload = await exportLocalArchive();
    return jsonOk(payload);
  }

  const session = await requireSecureRouteSession(request);
  if (!session.ok) {
    return session.response;
  }

  const payload = await exportUserArchive({
    supabase: session.supabase,
    userId: session.user.id,
  });

  await recordAnalyticsEvent({
    supabase: session.supabase,
    userId: session.user.id,
    eventName: "export_created",
    metadata: {
      restaurant_count: payload.restaurants.length,
      visit_count: payload.visits.length,
      to_eat_item_count: payload.to_eat_items.length,
    },
  });

  return jsonOk(payload);
}
