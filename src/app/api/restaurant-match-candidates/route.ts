import { hasSupabasePublicEnv } from "@/lib/env";
import { restaurantMatchQuerySchema } from "@/lib/validators";
import { jsonError, jsonOk } from "@/server/http";
import { searchLocalRestaurantMatches } from "@/server/localStore";
import { requireRouteSession } from "@/server/routeContext";
import { searchRestaurantMatchCandidates } from "@/server/services/restaurantMatches";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = restaurantMatchQuerySchema.safeParse(json);

  if (!parsed.success) {
    return jsonError("Invalid restaurant match query.", 400, {
      issues: parsed.error.flatten(),
    });
  }

  if (!hasSupabasePublicEnv()) {
    const candidates = await searchLocalRestaurantMatches(parsed.data);
    return jsonOk({ candidates, storage_mode: "local" });
  }

  const session = await requireRouteSession();
  if (!session.ok) {
    return session.response;
  }

  const candidates = await searchRestaurantMatchCandidates({
    supabase: session.supabase,
    userId: session.user.id,
    query: parsed.data,
  });

  return jsonOk({ candidates, storage_mode: "supabase" });
}
