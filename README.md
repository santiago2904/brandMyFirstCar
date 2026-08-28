# brandMyFirstCar

Live-auction landing page for sponsoring sticker spots on the author's first car.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in Supabase + Lemon Squeezy keys.
3. Apply `supabase/migrations/0001_init.sql` to your Supabase project (via
   `supabase db push` with the CLI linked, or paste it into the Supabase SQL editor).
4. Set the campaign end date (run once against your Supabase project):
   ```sql
   insert into campaign (id, start_date, end_date, sponsor_exposure_months)
   values (1, now(), now() + interval '7 days', 6)
   on conflict (id) do update set start_date = excluded.start_date, end_date = excluded.end_date;
   ```
5. `npm run dev`

## Deploy

`vercel deploy --prod`, then set the same env vars from `.env.example` in the Vercel
project settings, plus a Lemon Squeezy webhook pointed at
`https://<domain>/api/webhooks/lemonsqueezy` for the `order_created` event.

Payments run through Lemon Squeezy as Merchant of Record (Stripe does not support
Colombia-based merchants), so no separate payment gateway account is needed.

## Tests

`npm test` — covers `lib/bidding.ts` and `lib/lemonsqueezy.ts` only. UI and page
components are not unit-tested by design (see design spec §7).

## Known gaps before launch

- Placeholder zone prices in `supabase/migrations/0001_init.sql` — replace with real
  figures for the actual car.
- No Supabase/Lemon Squeezy project is wired up yet — this repo has been verified to
  build, typecheck, and boot locally, but the bidding flow has not been exercised
  against real accounts.
