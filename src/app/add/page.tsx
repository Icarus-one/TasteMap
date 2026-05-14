import { AddRecordClient } from "@/components/add/AddRecordClient";
import { AppHeader } from "@/components/layout/AppHeader";
import { ConfigNotice } from "@/components/layout/ConfigNotice";
import {
  getAvailableVisitTags,
  getSessionContext,
  getToEatItemById,
} from "@/lib/data";

export const dynamic = "force-dynamic";

type AddPageProps = {
  searchParams: Promise<{ from_todo?: string }>;
};

export default async function AddPage({ searchParams }: AddPageProps) {
  const { configured } = await getSessionContext({ protect: true });
  const availableTags = await getAvailableVisitTags();
  const { from_todo: fromTodo } = await searchParams;
  const prefillToDoItem =
    typeof fromTodo === "string" ? await getToEatItemById(fromTodo) : null;

  return (
    <main className="min-h-screen bg-stone-50">
      <AppHeader />
      <div className="mx-auto grid w-full max-w-4xl gap-6 px-4 py-6 sm:px-6 sm:py-8">
        {!configured ? <ConfigNotice /> : null}
        <AddRecordClient
          configured={configured}
          mapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? null}
          availableTags={availableTags}
          prefillToDoItem={prefillToDoItem}
        />
      </div>
    </main>
  );
}
