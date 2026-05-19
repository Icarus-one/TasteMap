import { AppHeader } from "@/components/layout/AppHeader";
import { ConfigNotice } from "@/components/layout/ConfigNotice";
import { MetricsDashboardClient } from "@/components/metrics/MetricsDashboardClient";
import { getSessionContext } from "@/lib/data";
import {
  getAnalyticsAdminClientForEmail,
  getAnalyticsOverview,
} from "@/server/services/analyticsMetrics";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  const context = await getSessionContext({ protect: true });

  if (!context.configured || !context.supabase || !context.user) {
    return (
      <main className="min-h-screen bg-stone-50 pb-24 sm:pb-0">
        <AppHeader />
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
          <ConfigNotice />
        </div>
      </main>
    );
  }

  const admin = await getAnalyticsAdminClientForEmail(context.user.email ?? null);
  if (!admin) notFound();

  const overview = await getAnalyticsOverview({
    supabase: context.supabase,
    userId: context.user.id,
    userEmail: context.user.email ?? null,
  });

  return (
    <main className="min-h-screen bg-stone-50 pb-24 sm:pb-0">
      <AppHeader />
      <MetricsDashboardClient overview={overview} />
    </main>
  );
}
