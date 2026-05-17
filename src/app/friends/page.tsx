import { AppHeader } from "@/components/layout/AppHeader";
import { FriendsHubClient } from "@/components/social/FriendsHubClient";
import { getSessionContext } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const context = await getSessionContext({ protect: true });

  return (
    <main className="min-h-screen bg-stone-50">
      <AppHeader />
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="grid gap-2">
          <p className="text-sm font-semibold uppercase text-emerald-700">
            Trust network
          </p>
          <h1 className="text-3xl font-bold text-stone-950 sm:text-4xl">
            Friends, shared lists, and trusted cards
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-stone-600">
            Add people whose taste you trust, share restaurant cards privately,
            and keep small food lists for trips, dates, and hidden gems.
          </p>
        </section>

        <FriendsHubClient
          configured={context.configured}
          currentUserId={context.user?.id ?? null}
          currentHandle={context.profile?.handle ?? null}
        />
      </div>
    </main>
  );
}
