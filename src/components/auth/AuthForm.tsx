"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Mail, LockKeyhole } from "lucide-react";
import {
  canUseSupabaseInBrowser,
  createSupabaseBrowserClient,
} from "@/lib/supabaseClient";
import { useI18n } from "@/lib/i18n";

type AuthFormProps = {
  mode: "login" | "signup";
  nextPath?: string;
};

export function AuthForm({ mode, nextPath = "/" }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isSignup = mode === "signup";
  const { t } = useI18n();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!canUseSupabaseInBrowser()) {
      setMessage(t("auth.missingSupabase"));
      return;
    }

    setIsLoading(true);
    const supabase = createSupabaseBrowserClient();
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", sanitizeNextPath(nextPath));
    const result = isSignup
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo.toString(),
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    setIsLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (isSignup && !result.data.session) {
      setMessage(t("auth.checkEmail"));
      return;
    }

    router.push(sanitizeNextPath(nextPath));
    router.refresh();
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
      <label className="grid gap-2 text-sm font-semibold text-stone-700">
        {t("auth.password")}
        <span className="relative">
          <LockKeyhole
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            placeholder={t("auth.passwordPlaceholder")}
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
        {isLoading
          ? t("auth.working")
          : isSignup
            ? t("auth.createAccount")
            : t("auth.signIn")}
        <ArrowRight aria-hidden="true" className="size-4" />
      </button>
      <p className="text-center text-sm text-stone-600">
        {isSignup ? t("auth.alreadyHaveAccount") : t("auth.newToTasteMap")}{" "}
        <Link
          href={authHref(isSignup ? "/login" : "/signup", nextPath)}
          className="font-semibold text-stone-950 underline decoration-stone-300 underline-offset-4"
        >
          {isSignup ? t("auth.signIn") : t("auth.createAccount")}
        </Link>
      </p>
    </form>
  );
}

function sanitizeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function authHref(path: "/login" | "/signup", nextPath: string) {
  const params = new URLSearchParams();
  const next = sanitizeNextPath(nextPath);
  if (next !== "/") {
    params.set("next", next);
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

