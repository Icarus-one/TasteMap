# TasteMap / 味迹

A web-first private food archive that turns meal photos and saved recommendations into structured restaurant memory.

TasteMap is built for one core habit:

`save a meal -> remember the restaurant -> remember the dishes -> decide faster next time`

Instead of acting like a public review site, it works more like a private food database:

- post a meal log from photos
- keep a private to-do queue from links or manual saves
- turn a to-do item into a real meal log later
- search by tags, dishes, and restaurant memory

## What the app does

### 1. Post log

Create a meal log by uploading photos or manually entering a restaurant.

The current flow supports:

- one photo or multiple photos
- no photo at all
- optional EXIF time and GPS extraction
- optional nearby restaurant lookup
- AI dish suggestions from food photos
- dish-level voting:
  - recommended
  - neutral
  - skip next time
- 0 to 5 star rating with 0.5 steps
- optional average spend
- optional tags
- optional written note

Saved logs build out private restaurant cards over time.

### 2. To-do items

Save future food ideas in two ways:

- `Copy link`: paste a Xiaohongshu / Douyin / web link and let the app extract restaurant clues, cover image, and dish ideas
- `Manual`: write a lightweight item directly

Each to-do item can later be converted into a real meal log with prefilled restaurant context.

### 3. Restaurant archive

Every saved log contributes to a restaurant card with:

- restaurant name and location
- stars
- tags
- recommended dishes
- skipped dishes
- visit history
- shareable summary

### 4. Sharing

The app currently supports lightweight sharing from detail pages:

- restaurant detail
- visit detail
- to-do item detail

On supported devices it uses the native share sheet. Otherwise it falls back to copying a formatted share summary.

## Product direction

TasteMap is intentionally **not**:

- a public review community
- a food feed
- a merchant platform
- a social graph

The current product direction is:

> a private food archive and recommendation memory system

That means the project optimizes for low-friction capture first, then structured recall later.

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- OpenAI API for dish and content analysis
- Places API for nearby restaurant search
- Maps JavaScript API for the private log map
- `exifr` for EXIF parsing
- `zod` for validation

## Project structure

```text
src/
  app/
    add/
    api/
    auth/
    login/
    restaurants/[id]/
    search/
    settings/
    signup/
    todo/
    visits/[id]/
  components/
    add/
    archive/
    auth/
    cards/
    detail/
    layout/
    settings/
    share/
    to-eat/
    ui/
  lib/
  server/

supabase/
  schema.sql
  policies.sql
  storage.sql
```

## Local development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

The `dev` script is pinned to port 3000. If that port is already taken, stop the older Next.js process first, then run the command again.

Open:

```text
http://localhost:3000
```

Lint:

```bash
npm run lint
```

Production build check:

```bash
npm run build
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
PLACES_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
ANALYTICS_ADMIN_EMAILS=
```

### Notes

- `SUPABASE_SERVICE_ROLE_KEY` must stay server-side
- `OPENAI_API_KEY` must stay server-side
- `PLACES_API_KEY` should be treated as server-side for this app
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is browser-visible and must be restricted by HTTP referrer in Google Cloud
- `NEXT_PUBLIC_APP_URL` must be updated for production
- `ANALYTICS_ADMIN_EMAILS` is a comma-separated list of founder/admin emails that can see all-user metrics on `/metrics`; other users only see their own activity

## Growth metrics

TasteMap records first-party analytics events in Supabase for beta traction evidence.

Tracked automatically:

- page views and detail opens
- photo and link analysis
- visit and to-eat item creation
- search, nearby place lookup, sharing, friends, taste lists, and friend cards

Open `/metrics` after signing in to view MAU, WAU, WAU/MAU, core actions, D7/D30 retention, top pages, and latest events.

For existing Supabase projects, run:

```sql
supabase/migrations/202605181100_add_analytics_events.sql
```

## Supabase setup

The Supabase persistence setup lives in:

- `supabase/README.md`

Quick version:

1. Create a Supabase project
2. Fill `.env.local`
3. Run SQL in this order:
   1. `supabase/schema.sql`
   2. `supabase/policies.sql`
   3. `supabase/storage.sql`
4. Make sure the private `food-photos` bucket and public `avatars` bucket exist

## Storage modes

The app supports two modes:

### 1. Supabase mode

Used when environment variables are configured.

This enables:

- real auth
- cloud persistence
- private image upload
- RLS-protected user data

### 2. Local archive mode

Used as a fallback when Supabase is not configured.

In this mode:

- data is stored locally on the machine
- the app remains usable for prototyping
- cloud sync and auth are not active

Local archive data is stored under:

```text
.tastemap/local-db.json
```

This folder is ignored by git.

## Deployment

Recommended deployment:

- app: Vercel
- database/auth/storage: Supabase

### Deploy checklist

1. Push the repo to GitHub
2. Create a Supabase project
3. Run the SQL files in `supabase/`
4. Add environment variables in Vercel
5. Set:
   - Supabase Site URL
   - Supabase Auth Redirect URL
6. Deploy from Vercel

For auth callback support, make sure Supabase includes:

```text
http://localhost:3000/auth/callback
http://localhost:3000/auth/confirm
https://your-domain.com/auth/callback
https://your-domain.com/auth/confirm
```

### Supabase Auth checklist

In Supabase, open `Authentication -> URL Configuration` and set:

```text
Site URL: https://your-domain.com
Redirect URLs:
  http://localhost:3000/auth/callback
  http://localhost:3000/auth/confirm
  https://your-domain.com/auth/callback
  https://your-domain.com/auth/confirm
```

For social login, enable each provider in `Authentication -> Providers`.
The OAuth app callback URL configured at Google, GitHub, or Facebook should be
the Supabase callback URL, not the TasteMap callback URL:

```text
https://<your-project-ref>.supabase.co/auth/v1/callback
```

TasteMap then receives the final app callback at `/auth/callback`, exchanges the
code for a session, and sends the user through `/auth/confirmed` or `/auth/error`.

For password recovery in Supabase SSR mode, update the **Reset Password** email
template to send the token hash through TasteMap before showing the new-password
form:

```html
{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery
```

The app passes `/auth/confirm` as `redirectTo` for password reset emails. Keep
that exact URL in the Supabase redirect allow list. If you keep the default
Supabase verification URL instead, make sure the `redirect_to` destination is
allow-listed; otherwise Supabase falls back to the Site URL and users land on the
normal login/home flow instead of the reset form.

## Current status

This repo is an active MVP, not a finished product.

The main working areas are:

- photo-first meal logging
- to-do capture from links or manual input
- restaurant detail pages
- visit detail pages
- to-do detail pages
- lightweight sharing
- tag-based archive browsing

Some flows are intentionally lightweight or heuristic-based:

- nearby restaurant matching
- link analysis from social content
- AI dish extraction
- restaurant identity matching

They are designed to be editable by the user rather than fully automatic.

## Editing guide

If you are changing business logic later, the safest places to start are:

- validation:
  - `src/lib/validators.ts`
- add-log workflow:
  - `src/components/add/AddRecordClient.tsx`
- to-do capture workflow:
  - `src/components/to-eat/ToEatListClient.tsx`
- Supabase persistence:
  - `src/server/services/visitRecords.ts`
  - `src/server/services/toEatItems.ts`
- local fallback persistence:
  - `src/server/localStore.ts`
- SQL schema:
  - `supabase/schema.sql`

## License

No license has been added yet. Treat this repository as private unless you explicitly decide otherwise.
