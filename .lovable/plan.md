## Goal

Give you a single admin page where you can mint JV partner tracking codes today, and let JV partners self-register on a public page later — all reusing the existing `partners` + `referral_attributions` plumbing.

## How it slots into what's already there

- `partners` table already supports slug, display name, commission defaults, status (`active` / `suspended`), and `user_id`.
- `?ref=<slug>` / `/p/<slug>` capture is already wired (AttributionCapture + `src/lib/attribution.ts`).
- `get_partner_leaderboard` already counts signups per partner.
- `AdminPartnerOps` exists for reassigns/merges/score — but there's no place to **create** partners. We'll add that.

## Plan

### 1. New admin page: `/owner-console/jv-partners` (`src/pages/AdminJvPartners.tsx`)

Single page with two stacked cards:

**Create JV partner code**
- Inputs: `slug` (required, lowercased + slugified on blur, uniqueness checked), `display_name`, `landing_path` selector (`/`, `/waitlist`, `/assess`, `/premium`), commission % (default 30), notes.
- "Create" inserts a row into `partners` with `status = 'active'`, `user_id = <your admin id>` (acts as owner placeholder until a real JV user claims it).
- After create: shows the generated tracking URL (`https://leadio.johnnybeirne.com<landing>?ref=<slug>`) with copy button + a "Copy /p/ link" alt.

**All JV partners (table)**
- Columns: slug, display name, status, signups (from `get_partner_leaderboard`), commission %, tracking URL (copy), actions.
- Actions per row: Copy URL, Edit (display name / commission / landing path stored in `notes` as JSON or a tiny new column), Suspend/Activate (toggle `status`), Open `/p/<slug>` in new tab.
- Search box filters by slug or display name.

### 2. Sidebar entry

Add "JV Partners" link in `src/components/admin/AdminSidebar.tsx` next to "Partner Ops" + route in `src/App.tsx` under `/owner-console`.

### 3. Schema touch-up (small migration)

Add two optional columns to `partners` so the admin page is self-contained:
- `landing_path text default '/'` — where the tracking URL drops visitors.
- `notes text` — admin-only notes.

No RLS changes needed; existing admin policies already allow insert/update/delete.

### 4. Future-proofing for JV self-signup (scaffold only — not built yet)

- Add a `pending` value to the existing `partner_status` enum.
- A public `/partners/apply` page can later insert a row with `status = 'pending'` + the applicant's `user_id`; admin approves from the same JV Partners table by flipping status to `active`.

I'll only add the enum value in this round (cheap, unblocks the next step). The application form itself is a separate follow-up so we don't bloat this change.

### What stays untouched

- Existing `/partners` marketing page, `AdminPartnerOps`, coupon attribution, leaderboard RPC.
- `usePromoter` / `promoters` table (that's the in-product viral loop, distinct from JV partners).

## What I need from you to proceed

1. Confirm the route name `/owner-console/jv-partners` and sidebar label "JV Partners".
2. Default commission % for new JV codes — `30` (current partner default) OK, or different?
3. Should the landing URL default to `/` or `/premium`?
