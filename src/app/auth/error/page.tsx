import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { I18nText } from "@/components/i18n/I18nText";

type AuthErrorPageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { message } = await searchParams;

  return (
    <main className="min-h-screen bg-stone-50">
      <AppHeader showAuthActions={false} />
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center px-4 py-10 sm:px-6">
        <div className="mx-auto grid w-full max-w-md gap-6 rounded-lg border border-amber-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle aria-hidden="true" className="size-7" />
          </div>
          <div className="grid gap-2">
            <h1 className="text-2xl font-bold text-stone-950">
              <I18nText k="auth.error.title" />
            </h1>
            <p className="text-sm leading-6 text-stone-600">
              <I18nText k="auth.error.subtitle" />
            </p>
          </div>
          {message ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-sm leading-6 text-amber-900">
              {message}
            </p>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-stone-950 px-4 text-sm font-bold text-white transition hover:bg-stone-800"
            >
              <I18nText k="auth.signIn" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-stone-800 transition hover:border-stone-400"
            >
              <I18nText k="auth.createAccount" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
