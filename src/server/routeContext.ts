import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { jsonError } from "@/server/http";

export async function requireRouteSession() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false as const,
      response: jsonError("Supabase env vars are not configured.", 503),
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false as const,
      response: jsonError("Please sign in first.", 401),
    };
  }

  return {
    ok: true as const,
    supabase,
    user,
  };
}

export type RouteUser = User;
