import { hasSupabasePublicEnv } from "@/lib/env";
import { createVisitSchema } from "@/lib/validators";
import { jsonError, jsonOk } from "@/server/http";
import { createLocalVisitFromPhotoRecord } from "@/server/localStore";
import { assertSameOrigin, requireSecureRouteSession } from "@/server/security";
import { recordAnalyticsEvent } from "@/server/services/analytics";
import { createVisitFromPhotoRecord } from "@/server/services/visitRecords";

export async function POST(request: Request) {
  try {
    const originError = assertSameOrigin(request);
    if (originError) return originError;

    const json = await request.json().catch(() => null);
    const parsed = createVisitSchema.safeParse(json);

    if (!parsed.success) {
      return jsonError("Invalid visit payload", 400, {
        issues: parsed.error.flatten(),
      });
    }

    if (!hasSupabasePublicEnv()) {
      const result = await createLocalVisitFromPhotoRecord(parsed.data);

      return jsonOk({
        visit_id: result.visitId,
        restaurant_id: result.restaurantId,
        storage_mode: "local",
      });
    }

    const session = await requireSecureRouteSession(request);
    if (!session.ok) {
      return session.response;
    }

    const result = await createVisitFromPhotoRecord({
      supabase: session.supabase,
      userId: session.user.id,
      input: parsed.data,
    });

    if ("error" in result) {
      return jsonError(result.error, result.status);
    }

    await recordAnalyticsEvent({
      supabase: session.supabase,
      userId: session.user.id,
      eventName: "visit_created",
      metadata: {
        visit_id: result.visitId,
        restaurant_id: result.restaurantId,
        photo_count: parsed.data.photos.length,
        dish_count: parsed.data.dishes.length,
        restaurant_mode: parsed.data.restaurant.mode,
        used_existing_restaurant: parsed.data.restaurant.mode === "existing",
      },
    });

    return jsonOk({
      visit_id: result.visitId,
      restaurant_id: result.restaurantId,
      storage_mode: "supabase",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save this visit.";
    return jsonError(message, 500);
  }
}
