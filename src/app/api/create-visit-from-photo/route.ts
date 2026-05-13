import { hasSupabasePublicEnv } from "@/lib/env";
import { createVisitSchema } from "@/lib/validators";
import { jsonError, jsonOk } from "@/server/http";
import { createLocalVisitFromPhotoRecord } from "@/server/localStore";
import { requireRouteSession } from "@/server/routeContext";
import { createVisitFromPhotoRecord } from "@/server/services/visitRecords";

export async function POST(request: Request) {
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

  const session = await requireRouteSession();
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

  return jsonOk({
    visit_id: result.visitId,
    restaurant_id: result.restaurantId,
    storage_mode: "supabase",
  });
}
