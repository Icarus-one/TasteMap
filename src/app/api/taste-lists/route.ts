import { hasSupabasePublicEnv } from "@/lib/env";
import { createTasteListSchema } from "@/lib/validators";
import { jsonError, jsonOk } from "@/server/http";
import { assertSameOrigin, requireSecureRouteSession } from "@/server/security";
import type { Profile, TasteList, TasteListItem } from "@/lib/types";

export async function GET(request: Request) {
  if (!hasSupabasePublicEnv()) {
    return jsonOk({ lists: [], storage_mode: "local" });
  }

  const session = await requireSecureRouteSession(request);
  if (!session.ok) return session.response;

  const { data, error } = await session.supabase
    .from("taste_lists")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(80);

  if (error) return jsonError(error.message, 400);

  const lists = (data as TasteList[] | null) ?? [];
  const listIds = lists.map((list) => list.id);
  const ownerIds = Array.from(new Set(lists.map((list) => list.user_id)));

  const [{ data: items }, { data: profiles }] = await Promise.all([
    listIds.length
      ? session.supabase
          .from("taste_list_items")
          .select("*")
          .in("list_id", listIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as TasteListItem[], error: null }),
    ownerIds.length
      ? session.supabase
          .from("profiles")
          .select("id, display_name, handle, avatar_url, created_at, updated_at")
          .in("id", ownerIds)
      : Promise.resolve({ data: [] as Profile[], error: null }),
  ]);

  const itemsByList = new Map<string, TasteListItem[]>();
  ((items as TasteListItem[] | null) ?? []).forEach((item) => {
    itemsByList.set(item.list_id, [...(itemsByList.get(item.list_id) ?? []), item]);
  });
  const profilesById = new Map(
    ((profiles as Profile[] | null) ?? []).map((profile) => [profile.id, profile]),
  );

  return jsonOk({
    lists: lists.map((list) => ({
      ...list,
      profiles: profilesById.get(list.user_id) ?? null,
      taste_list_items: itemsByList.get(list.id) ?? [],
      is_owner: list.user_id === session.user.id,
    })),
    storage_mode: "supabase",
  });
}

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const json = await request.json().catch(() => null);
  const parsed = createTasteListSchema.safeParse(json);

  if (!parsed.success) {
    return jsonError("Invalid list payload.", 400, {
      issues: parsed.error.flatten(),
    });
  }

  if (!hasSupabasePublicEnv()) {
    return jsonError("Shared lists need Supabase auth to be configured.", 503);
  }

  const session = await requireSecureRouteSession(request);
  if (!session.ok) return session.response;

  const { data, error } = await session.supabase
    .from("taste_lists")
    .insert({
      user_id: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      visibility: parsed.data.visibility,
    })
    .select("*")
    .single();

  if (error || !data) {
    return jsonError(error?.message ?? "Could not create list.", 400);
  }

  return jsonOk({ list: data, storage_mode: "supabase" });
}
