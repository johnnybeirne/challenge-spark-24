## Goal

Give you one unique URL to put on johnnybeirne.com so every signup that comes from it is tagged and countable in your admin.

## How the system already works

The app already has full referral attribution built in:

- Any visit to `?ref=<slug>` or `/p/<slug>` is captured first-touch into localStorage + cookie (`src/components/AttributionCapture.tsx` + `src/lib/attribution.ts`).
- On signup, that slug is resolved against the `partners` table and a row is written to `referral_attributions` (binding user → partner).
- The Admin → Signups page (`src/pages/AdminSignups.tsx`) already shows a "Partner: <slug>" badge per signup and has a "Via partner" filter + count tile.
- The partner leaderboard RPC `get_partner_leaderboard` already aggregates signup counts per partner slug.

So we don't need to build tracking — we just need to **create one partner row for your website** and hand you the URL.

## Plan

1. **Create a partner row** in the `partners` table via a data insert:
   - `slug`: `website` (short, clean, easy to read in URLs)
   - `display_name`: `Johnny Beirne Website`
   - `status`: `active`
   - `user_id`: your admin user id
   - Commission fields: leave at defaults (won't be used unless you wire payouts to it).

2. **Your tracking URL** becomes:
   ```
   https://leadio.johnnybeirne.com/?ref=website
   ```
   (also works on any route, e.g. `/waitlist?ref=website` or `/assess?ref=website` — first-touch wins, so whichever landing page you point at is fine)

3. **Where you see the results:**
   - Admin → Signups: filter by "Via partner" or search `website` → each row shows a `Partner: website` badge.
   - Admin → Partner Ops / Leaderboard: `website` appears with its signup count.

## Optional extras (say the word and I'll add)

- A second slug like `website-hero` vs `website-footer` so you can A/B which placement on your site converts better.
- A small "Website signups" KPI tile on the admin dashboard for at-a-glance count.
- A QR code generator for the URL.

## Technical notes

- No code changes needed for tracking — only a single `INSERT INTO partners` migration/insert.
- The `referred_by_code` flow on the waitlist also reads `?ref=`, so waitlist signups from the same URL will be attributed too.

## What I need from you to proceed

1. Confirm the slug — default suggestion: `website`. Want something else (e.g. `jb`, `site`, `johnnyb`)?
2. Which landing page should the URL drop visitors on? Options:
   - `/` (Landing)
   - `/waitlist` (current waitlist page)
   - `/assess` (assessment funnel)
