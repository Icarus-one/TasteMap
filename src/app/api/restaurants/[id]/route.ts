import { hasSupabasePublicEnv } from "@/lib/env";
import { updateRestaurantSchema } from "@/lib/validators";
import { jsonError, jsonOk } from "@/server/http";
import {
  deleteLocalRestaurant,
  updateLocalRestaurant,
} from "@/server/localStore";
import { assertSameOrigin, requireSecureRouteSession } from "@/server/security";

type RestaurantRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RestaurantRouteContext) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const { id } = await context.params;
  const json = await request.json().catch(() => null);
  const parsed = updateRestaurantSchema.safeParse(json);

  if (!parsed.success) {
    return jsonError("Invalid restaurant update.", 400, {
      issues: parsed.error.flatten(),
    });
  }

  if (!hasSupabasePublicEnv()) {
    const result = await updateLocalRestaurant({ id, input: parsed.data });
    if ("error" in result) {
      return jsonError(result.error, 404);
    }

    return jsonOk({ restaurant: result.restaurant, storage_mode: "local" });
  }

  const session = await requireSecureRouteSession(request);
  if (!session.ok) {
    return session.response;
  }

  const { data, error } = await session.supabase
    .from("restaurants")
    .update({
      name: parsed.data.name,
      city: parsed.data.city ?? null,
      address: parsed.data.address ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select("*")
    .single();

  if (error || !data) {
    return jsonError(error?.message ?? "Restaurant not found.", 404);
  }

  return jsonOk({ restaurant: data, storage_mode: "supabase" });
}

export async function DELETE(
  request: Request,
  context: RestaurantRouteContext,
) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const { id } = await context.params;

  if (!hasSupabasePublicEnv()) {
    const result = await deleteLocalRestaurant(id);
    if ("error" in result) {
      return jsonError(result.error, 404);
    }

    return jsonOk({ ok: true, storage_mode: "local" });
  }

  const session = await requireSecureRouteSession(request);
  if (!session.ok) {
    return session.response;
  }

  await session.supabase
    .from("restaurant_aliases")
    .delete()
    .eq("restaurant_id", id)
    .eq("user_id", session.user.id);

  const { error } = await session.supabase
    .from("restaurants")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) {
    return jsonError(error.message, 400);
  }

  return jsonOk({ ok: true, storage_mode: "supabase" });
}
