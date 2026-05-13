export function ConfigNotice() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Supabase is not configured yet, so TasteMap is running in local archive
      mode. You can still save logs on this device now, then add `.env.local`
      later to enable login, cloud uploads, and synced private storage.
    </div>
  );
}
