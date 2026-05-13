import { hasSupabasePublicEnv } from "@/lib/env";
import { jsonOk } from "@/server/http";
import { exportLocalArchive } from "@/server/localStore";
import { requireRouteSession } from "@/server/routeContext";
import { exportUserArchive } from "@/server/services/userArchive";

export async function GET() {
  if (!hasSupabasePublicEnv()) {
    const payload = await exportLocalArchive();
    return jsonOk(payload);
  }

  const session = await requireRouteSession();
  if (!session.ok) {
    return session.response;
  }

  const payload = await exportUserArchive({
    supabase: session.supabase,
    userId: session.user.id,
  });

  return jsonOk(payload);
}
