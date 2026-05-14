import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { I18nText } from "@/components/i18n/I18nText";

type AuthConfirmedPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AuthConfirmedPage({
  searchParams,
}: AuthConfirmedPageProps) {
  const { next } = await searchParams;
  const nextPath = sanitizeNextPath(next ?? "/");

  return (
    <main className="min-h-screen bg-stone-50">
      <AppHeader showAuthActions={false} />
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center px-4 py-10 sm:px-6">
        <div className="mx-auto grid w-full max-w-md gap-6 rounded-lg border border-stone-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 aria-hidden="true" className="size-7" />
          </div>
          <div className="grid gap-2">
            <h1 className="text-2xl font-bold text-stone-950">
              <I18nText k="auth.confirmed.title" />
            </h1>
            <p className="text-sm leading-6 text-stone-600">
              <I18nText k="auth.confirmed.subtitle" />
            </p>
          </div>
          <Link
            href={nextPath}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-stone-950 px-4 text-sm font-bold text-white transition hover:bg-stone-800"
          >
            <I18nText k="auth.continue" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function sanitizeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
