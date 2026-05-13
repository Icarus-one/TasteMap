import { hasSupabasePublicEnv } from "@/lib/env";
import { jsonOk } from "@/server/http";
import { deleteLocalArchive } from "@/server/localStore";
import { requireRouteSession } from "@/server/routeContext";
import { deleteUserArchive } from "@/server/services/userArchive";

export async function DELETE() {
  if (!hasSupabasePublicEnv()) {
    await deleteLocalArchive();
    return jsonOk({ ok: true, storage_mode: "local" });
  }

  const session = await requireRouteSession();
  if (!session.ok) {
    return session.response;
  }

  await deleteUserArchive({
    supabase: session.supabase,
    userId: session.user.id,
  });

  return jsonOk({ ok: true });
}
