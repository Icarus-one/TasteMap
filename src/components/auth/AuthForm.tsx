"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Mail, LockKeyhole } from "lucide-react";
import {
  canUseSupabaseInBrowser,
  createSupabaseBrowserClient,
} from "@/lib/supabaseClient";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isSignup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!canUseSupabaseInBrowser()) {
      setMessage("Supabase env vars are missing. Add .env.local before using auth.");
      return;
    }

    setIsLoading(true);
    const supabase = createSupabaseBrowserClient();
    const result = isSignup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    setIsLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (isSignup && !result.data.session) {
      setMessage("Check your email to confirm the account, then sign in.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <label className="grid gap-2 text-sm font-semibold text-stone-700">
        Email
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
            placeholder="you@example.com"
          />
        </span>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-stone-700">
        Password
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
            placeholder="At least 6 characters"
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
        {isLoading ? "Working" : isSignup ? "Create account" : "Sign in"}
        <ArrowRight aria-hidden="true" className="size-4" />
      </button>
      <p className="text-center text-sm text-stone-600">
        {isSignup ? "Already have an account?" : "New to TasteMap?"}{" "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-semibold text-stone-950 underline decoration-stone-300 underline-offset-4"
        >
          {isSignup ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}

