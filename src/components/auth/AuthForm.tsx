"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, AtSign, Mail, LockKeyhole, UserRound } from "lucide-react";
import type { Provider } from "@supabase/supabase-js";
import {
  canUseSupabaseInBrowser,
  createSupabaseBrowserClient,
} from "@/lib/supabaseClient";
import { useI18n } from "@/lib/i18n";
import { SocialProviderIcon } from "@/components/auth/SocialProviderIcon";
import {
  defaultDisplayNameForLanguage,
  generateProfileHandle,
} from "@/lib/profileUtils";

type AuthFormProps = {
  mode: "login" | "signup";
  nextPath?: string;
};

export function AuthForm({ mode, nextPath = "/" }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [defaultHandle] = useState(() => generateProfileHandle());
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [displayNameTouched, setDisplayNameTouched] = useState(false);
  const [handleTouched, setHandleTouched] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<Provider | null>(null);
  const isSignup = mode === "signup";
  const { language, t } = useI18n();
  const effectiveDisplayName =
    isSignup && !displayNameTouched
      ? defaultDisplayNameForLanguage(language)
      : displayName;
  const effectiveHandle = isSignup && !handleTouched ? defaultHandle : handle;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const normalizedHandle = effectiveHandle.trim().toLowerCase();

    if (isSignup && !/^[A-Za-z0-9._-]{1,20}$/.test(normalizedHandle)) {
      setMessage(t("profile.handleInvalid"));
      return;
    }

    if (isSignup && !isStrongPassword(password)) {
      setMessage(t("auth.passwordWeak"));
      return;
    }

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
            data: {
              display_name: effectiveDisplayName.trim(),
              handle: normalizedHandle,
            },
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

    if (isSignup) {
      const profileResponse = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: effectiveDisplayName.trim(),
          handle: normalizedHandle,
          avatar_url: "",
        }),
      });

      if (!profileResponse.ok) {
        const payload = (await profileResponse.json().catch(() => null)) as {
          error?: string;
        } | null;
        setMessage(payload?.error ?? t("profile.saveError"));
        return;
      }
    }

    router.push(sanitizeNextPath(nextPath));
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <SocialAuthOptions
        oauthProvider={oauthProvider}
        onSelect={signInWithOAuth}
        workingLabel={t("auth.working")}
        title={t("auth.orContinueWith")}
      />
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-stone-200" />
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          {t("auth.orUseEmail")}
        </span>
        <span className="h-px flex-1 bg-stone-200" />
      </div>
      {isSignup ? (
        <>
          <label className="grid gap-2 text-sm font-semibold text-stone-700">
            {t("profile.displayName")}
            <span className="relative">
              <UserRound
                aria-hidden="true"
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                required
                maxLength={30}
              value={effectiveDisplayName}
              onChange={(event) => {
                setDisplayNameTouched(true);
                setDisplayName(event.target.value);
              }}
                className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                placeholder={t("profile.displayNamePlaceholder")}
              />
            </span>
          </label>
          <div className="grid gap-2 text-sm font-semibold text-stone-700">
            <div className="flex items-center justify-between gap-3">
              <span>{t("profile.handle")}</span>
              <button
                type="button"
                onClick={() => {
                  setHandleTouched(true);
                  setHandle(generateProfileHandle());
                }}
                className="text-xs font-bold text-stone-700 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-950"
              >
                {t("profile.randomHandle")}
              </button>
            </div>
            <span className="relative">
              <AtSign
                aria-hidden="true"
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                required
                maxLength={20}
                value={effectiveHandle}
                onChange={(event) => {
                  setHandleTouched(true);
                  setHandle(event.target.value);
                }}
                className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                placeholder={t("profile.handlePlaceholder")}
              />
            </span>
            <span className="text-xs font-normal leading-5 text-stone-500">
              {t("profile.handleHelp")}
            </span>
          </div>
        </>
      ) : null}
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
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            placeholder={t("auth.passwordPlaceholder")}
          />
        </span>
        <span className="text-xs font-normal leading-5 text-stone-500">
          {t("auth.passwordHelp")}
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

  async function signInWithOAuth(provider: Provider) {
    setMessage(null);

    if (!canUseSupabaseInBrowser()) {
      setMessage(t("auth.missingSupabase"));
      return;
    }

    setOauthProvider(provider);
    const supabase = createSupabaseBrowserClient();
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", sanitizeNextPath(nextPath));

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo.toString(),
        skipBrowserRedirect: true,
        queryParams:
          provider === "google"
            ? {
                prompt: "select_account",
              }
            : undefined,
      },
    });

    if (error) {
      setOauthProvider(null);
      setMessage(error.message);
      return;
    }

    if (!data.url) {
      setOauthProvider(null);
      setMessage(t("auth.oauthStartFailed"));
      return;
    }

    window.location.assign(data.url);
  }
}

function SocialAuthOptions({
  oauthProvider,
  onSelect,
  workingLabel,
  title,
}: {
  oauthProvider: Provider | null;
  onSelect: (provider: Provider) => void;
  workingLabel: string;
  title: string;
}) {
  return (
    <div className="grid gap-3">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-stone-400">
        {title}
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {socialProviders.map((provider) => (
          <button
            key={provider.id}
            type="button"
            disabled={Boolean(oauthProvider)}
            onClick={() => onSelect(provider.id)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-800 transition hover:border-stone-300 hover:bg-stone-50 disabled:opacity-60"
          >
            <SocialProviderIcon provider={provider.id} />
            {oauthProvider === provider.id ? workingLabel : provider.label}
          </button>
        ))}
      </div>
    </div>
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

function isStrongPassword(value: string) {
  return (
    value.length >= 8 &&
    /[A-Za-z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

const socialProviders: Array<{
  id: Provider;
  label: string;
}> = [
  { id: "google", label: "Google" },
  { id: "github", label: "GitHub" },
  { id: "facebook", label: "Facebook" },
];

