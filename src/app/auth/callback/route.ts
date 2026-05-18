import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ensureProfileFromUser, isProfileComplete } from "@/lib/profile";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const error = requestUrl.searchParams.get("error");
  const errorDescription =
    requestUrl.searchParams.get("error_description") ??
    requestUrl.searchParams.get("message");
  const next = sanitizeNextPath(
    requestUrl.searchParams.get("next") ||
      (type === "recovery" ? "/auth/reset-password" : "/"),
  );
  const supabase = await createSupabaseServerClient();

  if (error) {
    return redirectToAuthError(
      requestUrl,
      errorDescription ?? error,
    );
  }

  if (!supabase) {
    return redirectToAuthError(requestUrl, "The sign-in link is missing an auth code.");
  }

  const { error: exchangeError } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        })
      : { error: new Error("The sign-in link is missing an auth code.") };

  if (exchangeError) {
    return redirectToAuthError(requestUrl, exchangeError.message);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectToAuthError(requestUrl, "The account was confirmed, but no session was created.");
  }

  const profile = await ensureProfileFromUser(supabase, user);
  if (next === "/auth/reset-password") {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  const destination = isProfileComplete(profile)
    ? next
    : `/profile/setup?next=${encodeURIComponent(next)}`;
  const confirmedUrl = new URL("/auth/confirmed", requestUrl.origin);
  confirmedUrl.searchParams.set("next", destination);

  return NextResponse.redirect(confirmedUrl);
}

function redirectToAuthError(requestUrl: URL, message: string) {
  const errorUrl = new URL("/auth/error", requestUrl.origin);
  errorUrl.searchParams.set("message", message);
  return NextResponse.redirect(errorUrl);
}

function sanitizeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
