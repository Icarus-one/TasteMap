"use client";

import { useEffect } from "react";
import {
  canUseSupabaseInBrowser,
  createSupabaseBrowserClient,
} from "@/lib/supabaseClient";

export function AuthRecoveryRedirect() {
  useEffect(() => {
    void handleRecoveryLink();
  }, []);

  return null;
}

async function handleRecoveryLink() {
  if (!canUseSupabaseInBrowser()) return;

  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(
    window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash,
  );
  const type = hashParams.get("type") ?? url.searchParams.get("type");
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  const tokenHash = url.searchParams.get("token_hash");
  const code = url.searchParams.get("code");

  if (type !== "recovery") return;

  const supabase = createSupabaseBrowserClient();

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      redirectToAuthError(error.message);
      return;
    }

    replaceWithResetPassword();
    return;
  }

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });

    if (error) {
      redirectToAuthError(error.message);
      return;
    }

    replaceWithResetPassword();
    return;
  }

  if (code) {
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("code", code);
    callbackUrl.searchParams.set("type", "recovery");
    callbackUrl.searchParams.set("next", "/auth/reset-password");
    window.location.replace(callbackUrl.toString());
  }
}

function replaceWithResetPassword() {
  const resetUrl = new URL("/auth/reset-password", window.location.origin);

  if (window.location.pathname === resetUrl.pathname) {
    window.history.replaceState(null, "", resetUrl.toString());
    return;
  }

  window.location.replace(resetUrl.toString());
}

function redirectToAuthError(message: string) {
  const errorUrl = new URL("/auth/error", window.location.origin);
  errorUrl.searchParams.set("message", message);
  window.location.replace(errorUrl.toString());
}
