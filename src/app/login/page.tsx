import { AppHeader } from "@/components/layout/AppHeader";
import { AuthForm } from "@/components/auth/AuthForm";
import { I18nText } from "@/components/i18n/I18nText";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <main className="min-h-screen bg-stone-50">
      <AppHeader showAuthActions={false} />
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center px-4 py-10 sm:px-6">
        <div className="mx-auto grid w-full max-w-md gap-6 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="grid gap-2 text-center">
            <h1 className="text-2xl font-bold text-stone-950">
              <I18nText k="auth.login.title" />
            </h1>
            <p className="text-sm leading-6 text-stone-600">
              <I18nText k="auth.login.subtitle" />
            </p>
          </div>
          <AuthForm mode="login" nextPath={next ?? "/"} />
        </div>
      </section>
    </main>
  );
}

