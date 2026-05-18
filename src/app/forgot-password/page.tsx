import { AppHeader } from "@/components/layout/AppHeader";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { I18nText } from "@/components/i18n/I18nText";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <AppHeader showAuthActions={false} />
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center px-4 py-10 sm:px-6">
        <div className="mx-auto grid w-full max-w-md gap-6 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="grid gap-2 text-center">
            <h1 className="text-2xl font-bold text-stone-950">
              <I18nText k="auth.forgotPassword.title" />
            </h1>
            <p className="text-sm leading-6 text-stone-600">
              <I18nText k="auth.forgotPassword.subtitle" />
            </p>
          </div>
          <ForgotPasswordForm />
        </div>
      </section>
    </main>
  );
}
