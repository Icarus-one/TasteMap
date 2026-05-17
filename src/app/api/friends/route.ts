import { hasSupabasePublicEnv } from "@/lib/env";
import { friendActionSchema, friendRequestSchema } from "@/lib/validators";
import { jsonError, jsonOk } from "@/server/http";
import { assertSameOrigin, requireSecureRouteSession } from "@/server/security";
import type { Friendship, Profile } from "@/lib/types";

type FriendBundle = {
  friendship: Friendship;
  profile: Profile | null;
};

export async function GET(request: Request) {
  if (!hasSupabasePublicEnv()) {
    return jsonOk({
      friends: [],
      incoming: [],
      outgoing: [],
      storage_mode: "local",
    });
  }

  const session = await requireSecureRouteSession(request);
  if (!session.ok) return session.response;

  const { data, error } = await session.supabase
    .from("friendships")
    .select("*")
    .or(`requester_id.eq.${session.user.id},addressee_id.eq.${session.user.id}`)
    .order("updated_at", { ascending: false });

  if (error) return jsonError(error.message, 400);

  const friendships = (data as Friendship[] | null) ?? [];
  const profileIds = Array.from(
    new Set(
      friendships.flatMap((friendship) => [
        friendship.requester_id,
        friendship.addressee_id,
      ]),
    ),
  );
  const { data: profileRows } = profileIds.length
    ? await session.supabase
        .from("profiles")
        .select("id, display_name, handle, avatar_url, created_at, updated_at")
        .in("id", profileIds)
    : { data: [] };
  const profiles = new Map(
    ((profileRows as Profile[] | null) ?? []).map((profile) => [
      profile.id,
      profile,
    ]),
  );

  const bundles = friendships.map((friendship): FriendBundle => {
    const otherId =
      friendship.requester_id === session.user.id
        ? friendship.addressee_id
        : friendship.requester_id;

    return {
      friendship,
      profile: profiles.get(otherId) ?? null,
    };
  });

  return jsonOk({
    friends: bundles.filter((item) => item.friendship.status === "accepted"),
    incoming: bundles.filter(
      (item) =>
        item.friendship.status === "pending" &&
        item.friendship.addressee_id === session.user.id,
    ),
    outgoing: bundles.filter(
      (item) =>
        item.friendship.status === "pending" &&
        item.friendship.requester_id === session.user.id,
    ),
    storage_mode: "supabase",
  });
}

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const json = await request.json().catch(() => null);
  const parsed = friendRequestSchema.safeParse(json);

  if (!parsed.success) {
    return jsonError("Invalid friend request.", 400, {
      issues: parsed.error.flatten(),
    });
  }

  if (!hasSupabasePublicEnv()) {
    return jsonError("Friends need Supabase auth to be configured.", 503);
  }

  const session = await requireSecureRouteSession(request);
  if (!session.ok) return session.response;

  const { data: target, error: targetError } = await session.supabase
    .from("profiles")
    .select("id, display_name, handle, avatar_url, created_at, updated_at")
    .eq("handle", parsed.data.handle)
    .maybeSingle();

  if (targetError) return jsonError(targetError.message, 400);
  if (!target) return jsonError("No TasteMap user found with that ID.", 404);
  if (target.id === session.user.id) {
    return jsonError("You cannot add yourself.", 400);
  }

  const { data: existing, error: existingError } = await session.supabase
    .from("friendships")
    .select("*")
    .or(
      `and(requester_id.eq.${session.user.id},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${session.user.id})`,
    )
    .maybeSingle();

  if (existingError) return jsonError(existingError.message, 400);
  if (existing) {
    return jsonOk({
      friendship: existing,
      profile: target,
      already_exists: true,
      storage_mode: "supabase",
    });
  }

  const { data: friendship, error } = await session.supabase
    .from("friendships")
    .insert({
      requester_id: session.user.id,
      addressee_id: target.id,
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !friendship) {
    return jsonError(error?.message ?? "Could not send friend request.", 400);
  }

  return jsonOk({
    friendship,
    profile: target,
    storage_mode: "supabase",
  });
}

export async function PATCH(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const json = await request.json().catch(() => null);
  const parsed = friendActionSchema.safeParse(json);

  if (!parsed.success) {
    return jsonError("Invalid friend action.", 400, {
      issues: parsed.error.flatten(),
    });
  }

  if (!hasSupabasePublicEnv()) {
    return jsonError("Friends need Supabase auth to be configured.", 503);
  }

  const session = await requireSecureRouteSession(request);
  if (!session.ok) return session.response;

  const { data: friendship, error: loadError } = await session.supabase
    .from("friendships")
    .select("*")
    .eq("id", parsed.data.id)
    .maybeSingle();

  const current = friendship as Friendship | null;

  if (loadError) return jsonError(loadError.message, 400);
  if (!current) return jsonError("Friendship not found.", 404);
  if (
    current.requester_id !== session.user.id &&
    current.addressee_id !== session.user.id
  ) {
    return jsonError("You cannot change this friendship.", 403);
  }

  if (parsed.data.action === "accept") {
    if (current.addressee_id !== session.user.id) {
      return jsonError("Only the recipient can accept this request.", 403);
    }

    const { data, error } = await session.supabase
      .from("friendships")
      .update({
        status: "accepted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", current.id)
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Could not accept request.", 400);
    }

    return jsonOk({ friendship: data, storage_mode: "supabase" });
  }

  const { error } = await session.supabase
    .from("friendships")
    .delete()
    .eq("id", current.id);

  if (error) return jsonError(error.message, 400);
  return jsonOk({ ok: true, storage_mode: "supabase" });
}
