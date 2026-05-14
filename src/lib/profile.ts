import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { Profile } from "@/lib/types";

type ProfileClient = {
  // Supabase's generated builder types differ between browser/server/admin clients.
  // This helper only needs the shared `from("profiles")` query surface.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: "profiles") => any;
};

export function isProfileComplete(profile?: Pick<Profile, "display_name" | "handle"> | null) {
  return Boolean(profile?.display_name?.trim() && profile.handle?.trim());
}

export function fallbackProfileFromUser(user: User): Pick<Profile, "display_name" | "handle" | "avatar_url"> {
  const metadata = user.user_metadata ?? {};
  return {
    display_name:
      typeof metadata.display_name === "string" ? metadata.display_name : null,
    handle: typeof metadata.handle === "string" ? metadata.handle : null,
    avatar_url: typeof metadata.avatar_url === "string" ? metadata.avatar_url : null,
  };
}

export async function getProfileForUser(
  client: ProfileClient,
  userId: string,
) {
  const { data } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return data;
}

export async function ensureProfileFromUser(
  client: ProfileClient,
  user: User,
) {
  const existing = await getProfileForUser(client, user.id);

  if (existing) return existing;

  const fallback = fallbackProfileFromUser(user);

  if (!isProfileComplete(fallback)) {
    return null;
  }

  const { data } = await client
    .from("profiles")
    .upsert(
      {
        id: user.id,
        display_name: fallback.display_name,
        handle: fallback.handle?.toLowerCase() ?? null,
        avatar_url: fallback.avatar_url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  return data;
}

export async function getCurrentProfile() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return ensureProfileFromUser(supabase, user);
}

export async function requireProfileSetup(options?: { next?: string }) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await ensureProfileFromUser(supabase, user);

  if (!isProfileComplete(profile)) {
    const params = new URLSearchParams();
    if (options?.next) params.set("next", options.next);
    redirect(`/profile/setup${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return profile;
}
