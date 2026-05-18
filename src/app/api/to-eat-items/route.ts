import { revalidatePath } from "next/cache";
import { hasSupabasePublicEnv } from "@/lib/env";
import { createToEatItemSchema, updateToEatItemSchema } from "@/lib/validators";
import { jsonError, jsonOk } from "@/server/http";
import {
  createLocalToEatItem,
  deleteLocalToEatItem,
  updateLocalToEatItem,
} from "@/server/localStore";
import { assertSameOrigin, requireSecureRouteSession } from "@/server/security";
import { recordAnalyticsEvent } from "@/server/services/analytics";
import {
  getShareLinkAttribution,
  recordShareAttributionEvent,
} from "@/server/services/shareAttribution";
import {
  createToEatItem,
  deleteToEatItem,
  updateToEatItem,
} from "@/server/services/toEatItems";

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const json = await request.json().catch(() => null);
  const parsed = createToEatItemSchema.safeParse(json);

  if (!parsed.success) {
    return jsonError("Invalid to-eat item", 400, {
      issues: parsed.error.flatten(),
    });
  }

  if (!hasSupabasePublicEnv()) {
    const result = await createLocalToEatItem(parsed.data);
    revalidatePaths();
    return jsonOk({ item: result.item, storage_mode: "local" });
  }

  const session = await requireSecureRouteSession(request);
  if (!session.ok) {
    return session.response;
  }

  const sourceShareToken = parsed.data.source_share_token ?? null;
  if (sourceShareToken) {
    const attribution = await getShareLinkAttribution(sourceShareToken);
    if (!attribution) {
      return jsonError("Shared restaurant link not found.", 404);
    }
  }

  const result = await createToEatItem({
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
    eventName: "to_eat_item_created",
    metadata: {
      item_id: result.item.id,
      source_platform: parsed.data.source_platform,
      has_source_url: Boolean(parsed.data.source_url),
      has_restaurant_name: Boolean(parsed.data.restaurant_name),
      source_share_token: sourceShareToken,
    },
  });

  if (sourceShareToken) {
    await recordShareAttributionEvent({
      token: sourceShareToken,
      eventName: "share_to_do_saved",
      userId: session.user.id,
      toEatItemId: result.item.id,
      metadata: {
        item_id: result.item.id,
        source_platform: parsed.data.source_platform,
      },
    });
  }

  revalidatePaths();
  return jsonOk({ item: result.item });
}

export async function PATCH(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const json = await request.json().catch(() => null);
  const parsed = updateToEatItemSchema.safeParse(json);

  if (!parsed.success) {
    return jsonError("Invalid to-eat update", 400, {
      issues: parsed.error.flatten(),
    });
  }

  if (!hasSupabasePublicEnv()) {
    const { id, ...input } = parsed.data;
    const result = await updateLocalToEatItem({ id, input });
    if ("error" in result) {
      return jsonError(result.error, 404);
    }
    revalidatePaths();
    return jsonOk({ item: result.item, storage_mode: "local" });
  }

  const session = await requireSecureRouteSession(request);
  if (!session.ok) {
    return session.response;
  }

  const result = await updateToEatItem({
    supabase: session.supabase,
    userId: session.user.id,
    input: parsed.data,
  });
  if ("error" in result) {
    return jsonError(result.error, result.status);
  }

  const eventName =
    parsed.data.status === "visited" && parsed.data.linked_visit_id
      ? "to_eat_item_converted"
      : "to_eat_item_updated";
  const updatedItem = result.item as { source_share_token?: string | null };

  await recordAnalyticsEvent({
    supabase: session.supabase,
    userId: session.user.id,
    eventName,
    metadata: {
      item_id: parsed.data.id,
      status: parsed.data.status,
      linked_visit_id: parsed.data.linked_visit_id ?? null,
      linked_restaurant_id: parsed.data.linked_restaurant_id ?? null,
      source_share_token: updatedItem.source_share_token ?? null,
    },
  });

  if (eventName === "to_eat_item_converted" && updatedItem.source_share_token) {
    await recordShareAttributionEvent({
      token: updatedItem.source_share_token,
      eventName: "share_to_do_converted",
      userId: session.user.id,
      toEatItemId: parsed.data.id,
      visitId: parsed.data.linked_visit_id ?? null,
      metadata: {
        item_id: parsed.data.id,
        linked_visit_id: parsed.data.linked_visit_id ?? null,
        linked_restaurant_id: parsed.data.linked_restaurant_id ?? null,
      },
    });
  }

  revalidatePaths();
  return jsonOk({ item: result.item });
}

export async function DELETE(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return jsonError("id is required", 400);
  }

  if (!hasSupabasePublicEnv()) {
    const result = await deleteLocalToEatItem(id);
    if ("error" in result) {
      return jsonError(result.error, 404);
    }
    revalidatePaths();
    return jsonOk({ ok: true, storage_mode: "local" });
  }

  const session = await requireSecureRouteSession(request);
  if (!session.ok) {
    return session.response;
  }

  const result = await deleteToEatItem({
    supabase: session.supabase,
    userId: session.user.id,
    id,
  });
  if ("error" in result) {
    return jsonError(result.error, result.status);
  }

  await recordAnalyticsEvent({
    supabase: session.supabase,
    userId: session.user.id,
    eventName: "to_eat_item_deleted",
    metadata: { item_id: id },
  });

  revalidatePaths();
  return jsonOk({ ok: true });
}

function revalidatePaths() {
  revalidatePath("/");
  revalidatePath("/todo");
  revalidatePath("/search");
  revalidatePath("/todo/[id]");
}
