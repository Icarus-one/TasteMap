import { hasSupabasePublicEnv } from "@/lib/env";
import { sendFriendCardSchema } from "@/lib/validators";
import { compactAddress } from "@/lib/format";
import { jsonError, jsonOk } from "@/server/http";
import { assertSameOrigin, requireSecureRouteSession } from "@/server/security";
import { recordAnalyticsEvent } from "@/server/services/analytics";
import type { FriendCardSend, Friendship, Profile, Restaurant } from "@/lib/types";

export async function GET(request: Request) {
  if (!hasSupabasePublicEnv()) {
    return jsonOk({ incoming: [], sent: [], storage_mode: "local" });
  }

  const session = await requireSecureRouteSession(request);
  if (!session.ok) return session.response;

  const { data, error } = await session.supabase
    .from("friend_card_sends")
    .select("*")
    .or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return jsonError(error.message, 400);

  const cards = (data as FriendCardSend[] | null) ?? [];
  const profileIds = Array.from(
    new Set(cards.flatMap((card) => [card.sender_id, card.recipient_id])),
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

  const hydrated = cards.map((card) => ({
    ...card,
    sender: profiles.get(card.sender_id) ?? null,
    recipient: profiles.get(card.recipient_id) ?? null,
  }));

  return jsonOk({
    incoming: hydrated.filter((card) => card.recipient_id === session.user.id),
    sent: hydrated.filter((card) => card.sender_id === session.user.id),
    storage_mode: "supabase",
  });
}

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const json = await request.json().catch(() => null);
  const parsed = sendFriendCardSchema.safeParse(json);

  if (!parsed.success) {
    return jsonError("Invalid card send payload.", 400, {
      issues: parsed.error.flatten(),
    });
  }

  if (!hasSupabasePublicEnv()) {
    return jsonError("Friend card sends need Supabase auth to be configured.", 503);
  }

  const session = await requireSecureRouteSession(request);
  if (!session.ok) return session.response;

  const { data: friendship } = await session.supabase
    .from("friendships")
    .select("*")
    .eq("status", "accepted")
    .or(
      `and(requester_id.eq.${session.user.id},addressee_id.eq.${parsed.data.recipient_id}),and(requester_id.eq.${parsed.data.recipient_id},addressee_id.eq.${session.user.id})`,
    )
    .maybeSingle();

  if (!(friendship as Friendship | null)) {
    return jsonError("You can only send cards to accepted friends.", 403);
  }

  const { data: restaurant, error: restaurantError } = await session.supabase
    .from("restaurants")
    .select("*")
    .eq("id", parsed.data.restaurant_id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (restaurantError) return jsonError(restaurantError.message, 400);
  const target = restaurant as Restaurant | null;
  if (!target) return jsonError("Restaurant not found.", 404);

  const { data, error } = await session.supabase
    .from("friend_card_sends")
    .insert({
      sender_id: session.user.id,
      recipient_id: parsed.data.recipient_id,
      restaurant_id: target.id,
      card_title: target.name,
      card_subtitle: compactAddress(
        target.city,
        target.address,
        target.latitude,
        target.longitude,
      ),
      note: parsed.data.note,
    })
    .select("*")
    .single();

  if (error || !data) {
    return jsonError(error?.message ?? "Could not send this card.", 400);
  }

  await recordAnalyticsEvent({
    supabase: session.supabase,
    userId: session.user.id,
    eventName: "friend_card_sent",
    metadata: {
      card_id: data.id,
      recipient_id: parsed.data.recipient_id,
      restaurant_id: target.id,
    },
  });

  return jsonOk({ card: data, storage_mode: "supabase" });
}
