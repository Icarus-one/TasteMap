import { ConfigNotice } from "@/components/layout/ConfigNotice";
import { DashboardClient } from "@/components/DashboardClient";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { configured, restaurants, visits, toEatItems } = await getDashboardData();

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-6xl">
        {!configured ? <ConfigNotice /> : null}
        <DashboardClient
          restaurants={restaurants}
          toEatItems={toEatItems}
          visits={visits}
        />
      </div>
    </main>
  );
}
