"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import {
  canUseSupabaseInBrowser,
  createSupabaseBrowserClient,
} from "@/lib/supabaseClient";
import { useI18n } from "@/lib/i18n";

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!canUseSupabaseInBrowser()) {
      setMessage(t("auth.missingSupabase"));
      return;
    }

    setIsLoading(true);
    const supabase = createSupabaseBrowserClient();
    const redirectTo = new URL("/auth/reset-password", window.location.origin);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectTo.toString(),
    });

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(t("auth.resetEmailSent"));
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <label className="grid gap-2 text-sm font-semibold text-stone-700">
        {t("auth.email")}
        <span className="relative">
          <Mail
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            placeholder={t("auth.emailPlaceholder")}
          />
        </span>
      </label>
      {message ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
      >
        {isLoading ? t("auth.working") : t("auth.sendResetLink")}
        <ArrowRight aria-hidden="true" className="size-4" />
      </button>
      <Link
        href="/login"
        className="text-center text-sm font-semibold text-stone-950 underline decoration-stone-300 underline-offset-4"
      >
        {t("auth.backToSignIn")}
      </Link>
    </form>
  );
}
