import { hasSupabasePublicEnv } from "@/lib/env";
import { jsonOk } from "@/server/http";
import { deleteLocalArchive } from "@/server/localStore";
import { assertSameOrigin, requireSecureRouteSession } from "@/server/security";
import { deleteUserArchive } from "@/server/services/userArchive";

export async function DELETE(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  if (!hasSupabasePublicEnv()) {
    await deleteLocalArchive();
    return jsonOk({ ok: true, storage_mode: "local" });
  }

  const session = await requireSecureRouteSession(request);
  if (!session.ok) {
    return session.response;
  }

  await deleteUserArchive({
    supabase: session.supabase,
    userId: session.user.id,
  });

  return jsonOk({ ok: true });
}
