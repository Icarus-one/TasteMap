import { revalidatePath } from "next/cache";
import { hasSupabasePublicEnv } from "@/lib/env";
import { createToEatItemSchema, updateToEatItemSchema } from "@/lib/validators";
import { jsonError, jsonOk } from "@/server/http";
import {
  createLocalToEatItem,
  deleteLocalToEatItem,
  updateLocalToEatItem,
} from "@/server/localStore";
import { requireRouteSession } from "@/server/routeContext";
import {
  createToEatItem,
  deleteToEatItem,
  updateToEatItem,
} from "@/server/services/toEatItems";

export async function POST(request: Request) {
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

  const session = await requireRouteSession();
  if (!session.ok) {
    return session.response;
  }

  const result = await createToEatItem({
    supabase: session.supabase,
    userId: session.user.id,
    input: parsed.data,
  });
  if ("error" in result) {
    return jsonError(result.error, result.status);
  }

  revalidatePaths();
  return jsonOk({ item: result.item });
}

export async function PATCH(request: Request) {
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

  const session = await requireRouteSession();
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

  revalidatePaths();
  return jsonOk({ item: result.item });
}

export async function DELETE(request: Request) {
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

  const session = await requireRouteSession();
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

  revalidatePaths();
  return jsonOk({ ok: true });
}

function revalidatePaths() {
  revalidatePath("/");
  revalidatePath("/todo");
  revalidatePath("/search");
  revalidatePath("/todo/[id]");
}
