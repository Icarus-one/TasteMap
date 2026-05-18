import { analyticsClientEventSchema } from "@/lib/validators";
import { jsonError, jsonOk } from "@/server/http";
import {
  checkRateLimit,
  requireSecureRouteSession,
} from "@/server/security";
import { recordAnalyticsEvent } from "@/server/services/analytics";

export async function POST(request: Request) {
  const session = await requireSecureRouteSession(request);
  if (!session.ok) {
    return session.response;
  }

  const rateLimitError = checkRateLimit({
    key: `analytics-events:${session.user.id}`,
    limit: 180,
    windowMs: 10 * 60 * 1000,
  });
  if (rateLimitError) return rateLimitError;

  const parsed = analyticsClientEventSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return jsonError("Invalid analytics event.", 400, {
      issues: parsed.error.flatten(),
    });
  }

  await recordAnalyticsEvent({
    supabase: session.supabase,
    userId: session.user.id,
    eventName: parsed.data.event_name,
    path: parsed.data.path ?? null,
    sessionId: parsed.data.session_id ?? null,
    metadata: parsed.data.metadata,
  });

  return jsonOk({ ok: true });
}
