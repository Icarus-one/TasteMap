# TasteMap Security Checklist

Use this before sharing the production site publicly.

## Secrets

- Keep these only in Vercel/Supabase/Google/OpenAI dashboards or local ignored files:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`
  - `PLACES_API_KEY`
- Never commit `.env*`, `ChatGPT_API.txt`, or `Google_map_API_key.txt`.
- Rotate a key immediately if it appears in GitHub, screenshots, chats, or browser code.

## Supabase

- Run the latest SQL files in order:
  1. `supabase/schema.sql`
  2. `supabase/policies.sql`
  3. `supabase/storage.sql`
- Confirm RLS is enabled on user-owned tables.
- Confirm `food-photos` is private.
- Confirm auth redirect URLs include:
  - `https://taste-map-nu.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

## Vercel

- Environment variables must be set for Production and Preview.
- `NEXT_PUBLIC_APP_URL` must match the production domain.
- After env changes, redeploy.
- Keep the GitHub repository private unless you are ready to publish source code.

## Google / OpenAI

- Restrict the Google key to `Places API (New)`.
- Watch Google Maps and OpenAI usage dashboards after sharing publicly.
- Set billing alerts in Google Cloud and OpenAI.

## App Protections

- Paid API routes require a logged-in session.
- Mutating/private API routes reject cross-origin requests.
- Share links use random tokens instead of restaurant database IDs.
- Security headers are configured in `next.config.ts`.
