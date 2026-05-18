"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import {
  canUseSupabaseInBrowser,
  createSupabaseBrowserClient,
} from "@/lib/supabaseClient";
import { useI18n } from "@/lib/i18n";

export function ResetPasswordForm() {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!isStrongPassword(password)) {
      setMessage(t("auth.passwordWeak"));
      return;
    }

    if (password !== confirmPassword) {
      setMessage(t("auth.passwordMismatch"));
      return;
    }

    if (!canUseSupabaseInBrowser()) {
      setMessage(t("auth.missingSupabase"));
      return;
    }

    setIsLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setIsDone(true);
    setMessage(t("auth.passwordUpdated"));
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <PasswordField
        label={t("auth.newPassword")}
        value={password}
        onChange={setPassword}
        placeholder={t("auth.passwordPlaceholder")}
      />
      <PasswordField
        label={t("auth.confirmPassword")}
        value={confirmPassword}
        onChange={setConfirmPassword}
        placeholder={t("auth.passwordPlaceholder")}
      />
      <span className="text-xs leading-5 text-stone-500">
        {t("auth.passwordHelp")}
      </span>
      {message ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {message}
        </p>
      ) : null}
      {isDone ? (
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800"
        >
          {t("auth.continue")}
        </Link>
      ) : (
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
        >
          {isLoading ? t("auth.working") : t("auth.updatePassword")}
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      )}
    </form>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-stone-700">
      {label}
      <span className="relative">
        <LockKeyhole
          aria-hidden="true"
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
        />
        <input
          type="password"
          required
          minLength={8}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
          placeholder={placeholder}
        />
      </span>
    </label>
  );
}

function isStrongPassword(value: string) {
  return (
    value.length >= 8 &&
    /[A-Za-z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}
