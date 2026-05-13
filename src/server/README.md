# Backend Structure

TasteMap's backend is organized to keep route handlers thin and business rules easy to adjust.

## Layers

1. `src/app/api/*`
   - HTTP boundary only
   - parse request
   - validate input
   - call service
   - return JSON

2. `src/server/routeContext.ts`
   - shared route bootstrapping
   - Supabase client lookup
   - current user requirement

3. `src/server/services/*`
   - business logic
   - multi-table writes
   - archive export / delete flows
   - to-eat CRUD

4. `src/lib/*`
   - cross-cutting helpers used by both UI and API
   - validators, env helpers, EXIF parsing, formatting

## Current service entrypoints

- `visitRecords.ts`
  - creates a restaurant if needed
  - creates a visit
  - inserts dishes
  - inserts photos
  - updates restaurant freshness

- `toEatItems.ts`
  - create / update / delete to-eat items

- `userArchive.ts`
  - export all private user data
  - delete all private user data, including storage objects

## How to adjust behavior later

- change validation shape in `src/lib/validators.ts`
- change write rules in `src/server/services/*`
- keep route files small unless you are changing HTTP semantics

## Environment

Backend persistence requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)

AI and places also need:

- `OPENAI_API_KEY`
- `PLACES_API_KEY`
