import { profileInputSchema } from "@/lib/validators";
import { jsonError, jsonOk } from "@/server/http";
import { requireSecureRouteSession } from "@/server/security";

export async function PATCH(request: Request) {
  const session = await requireSecureRouteSession(request);
  if (!session.ok) {
    return session.response;
  }

  const parsed = profileInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError("Profile details are invalid.", 400, {
      issues: parsed.error.flatten(),
    });
  }

  const { data, error } = await session.supabase
    .from("profiles")
    .upsert(
      {
        id: session.user.id,
        display_name: parsed.data.display_name,
        handle: parsed.data.handle,
        avatar_url: parsed.data.avatar_url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return jsonError("That ID is already taken.", 409);
    }

    return jsonError(error.message, 500);
  }

  return jsonOk({ profile: data });
}
