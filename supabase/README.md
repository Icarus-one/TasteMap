# TasteMap Supabase Setup

This folder is the source of truth for the persistence layer.

## 1. Create the Supabase project

Create one project for the app and keep the project URL plus keys ready.

You will need:

- Project URL
- anon key
- service role key

## 2. Add local env vars

Create `.env.local` in the repo root and copy values from `.env.example`.

Required for database + auth + storage:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Also used by the app:

- `OPENAI_API_KEY`
- `PLACES_API_KEY`
- `NEXT_PUBLIC_APP_URL`

## 3. Run SQL in order

Apply these files in the Supabase SQL editor:

1. `schema.sql`
2. `policies.sql`
3. `storage.sql`

Re-run `schema.sql` and `policies.sql` after app updates too. They are written
to be repeatable and may add new tables or policies, such as share-link tokens.

Run each file as a whole file, not a partial column snippet. If the SQL editor
shows `taken_at timestamptz,;`, the editor received a partial statement with a
semicolon after a comma; paste the whole `schema.sql` file again.

After the SQL files complete, verify from the repo root:

```bash
npm run verify:supabase
```

## 4. Storage bucket shape

The `food-photos` bucket is private.

Photo paths are scoped as:

```text
{user_id}/{date}/{photo_id}-{file_name}
```

That path shape is required by the storage RLS policy and matches the upload logic in `src/components/add/AddRecordClient.tsx`.

## 5. Backend code map

- route auth/bootstrap:
  - `src/server/routeContext.ts`
- HTTP response helpers:
  - `src/server/http.ts`
- visit creation workflow:
  - `src/server/services/visitRecords.ts`
- to-eat CRUD:
  - `src/server/services/toEatItems.ts`
- export + destructive cleanup:
  - `src/server/services/userArchive.ts`

## 6. Safe places to edit later

If you want to change business rules, start here:

- payload validation:
  - `src/lib/validators.ts`
- visit creation rules:
  - `src/server/services/visitRecords.ts`
- to-eat persistence behavior:
  - `src/server/services/toEatItems.ts`
- SQL tables / constraints:
  - `supabase/schema.sql`
