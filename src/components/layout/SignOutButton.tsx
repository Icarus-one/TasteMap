"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { canUseSupabaseInBrowser, createSupabaseBrowserClient } from "@/lib/supabaseClient";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    if (!canUseSupabaseInBrowser()) return;
    setIsSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={isSigningOut}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 disabled:opacity-60"
    >
      <LogOut aria-hidden="true" className="size-4" />
      <span className="hidden sm:inline">{isSigningOut ? "Signing out" : "Sign out"}</span>
    </button>
  );
}

