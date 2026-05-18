import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { shareEventInputSchema } from "@/lib/validators";
import { jsonError, jsonOk } from "@/server/http";
import {
  assertSameOrigin,
  checkRateLimit,
} from "@/server/security";
import { recordShareAttributionEvent } from "@/server/services/shareAttribution";

type ShareRestaurantEventsRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  context: ShareRestaurantEventsRouteContext,
) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const { id: token } = await context.params;
  const parsed = shareEventInputSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return jsonError("Invalid share event.", 400, {
      issues: parsed.error.flatten(),
    });
  }

  const visitorKey = parsed.data.visitor_id ?? request.headers.get("x-forwarded-for") ?? "anonymous";
  const rateLimitError = checkRateLimit({
    key: `share-events:${token}:${visitorKey}`,
    limit: 60,
    windowMs: 10 * 60 * 1000,
  });
  if (rateLimitError) return rateLimitError;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };

  const attribution = await recordShareAttributionEvent({
    token,
    eventName: parsed.data.event_name,
    userId: user?.id ?? null,
    visitorId: parsed.data.visitor_id ?? null,
    metadata: parsed.data.metadata,
  });

  if (!attribution) {
    return jsonError("Share link not found.", 404);
  }

  return jsonOk({ ok: true });
}
