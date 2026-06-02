## Goal

1. Fix the unsubscribe link at the bottom of newsletter emails so it always lands on a working URL.
2. Give admins control of the `/unsubscribe` page copy and add two new features: a "reason for leaving" prompt and a "resubscribe" option.

---

## Part 1 — Fix the broken unsubscribe link

Two real bugs in `supabase/functions/send-newsletter/index.ts` (and same in `send-welcome-email/index.ts`):

- **Bug A — auto-footer silently skipped.** `ensureUnsubscribeFooter` returns the HTML untouched whenever it contains the word "unsubscribe" anywhere (case-insensitive). Templates that mention the word but don't include the `{{unsubscribe_url}}` token end up with no working link at all.
- **Bug B — hardcoded base URL.** `APP_BASE_URL` is pinned to `https://leadio.johnnybeirne.com`. If a recipient opens from anywhere else, or the published domain changes, links go to a domain they didn't sign up on.

Fixes:
- Change the footer guard so it only skips when a real `{{unsubscribe_url}}` token (or an `<a>` whose href contains `/unsubscribe?token=`) is already present in the HTML — not just the word "unsubscribe".
- Move `APP_BASE_URL` into a new `newsletter_settings` row (single-row table) so it's editable from the admin and used by both edge functions. Keep `leadio.johnnybeirne.com` as the default.
- Apply the same two fixes to `send-welcome-email`.

## Part 2 — Editable unsubscribe landing page

New single-row config table `unsubscribe_page_config` (admin-only write, public read) with fields for each state's heading + body:
- ready (`heading`, `body`, `confirm_button_label`)
- done (`heading`, `body`)
- already (`heading`, `body`)
- error (`heading`, `body`)
- feedback: `enabled` (bool), `prompt`, `placeholder`, `skip_label`, `submit_label`
- resubscribe: `enabled` (bool), `label`, `success_message`

New table `unsubscribe_feedback` (insert allowed for the unsubscribe edge function only via service role; admin-only read) with columns: `email`, `reason`, `created_at`.

## Part 3 — Edge function changes (`newsletter-unsubscribe`)

Extend the existing function with two new actions on POST:
- `{ token, reason }` — confirms unsubscribe AND stores the optional feedback reason (skips if empty).
- `{ token, action: "resubscribe" }` — deletes the row from `newsletter_suppressions` for the email tied to the token, so they start receiving emails again. Returns `{ ok: true, resubscribed: true, email }`.

GET response also returns the current `unsubscribe_page_config` so the page can render in one round-trip.

## Part 4 — Frontend

`src/pages/Unsubscribe.tsx`:
- Read copy from the GET response (fallback to current hardcoded strings if config is missing).
- After confirm: show feedback prompt (textarea + Submit / Skip) when `feedback.enabled`. Submitting POSTs `{ token, reason }`; Skip just moves on.
- On the "done" state, render a "Resubscribe" button when `resubscribe.enabled`. Clicking POSTs `{ token, action: "resubscribe" }` and swaps to a success message.

`src/pages/AdminNewsletter.tsx`:
- New "Unsubscribe page" tab (or section) with form fields for every config value above, plus an editable "App base URL" field (drives Part 1 fix).
- New "Feedback" panel listing recent `unsubscribe_feedback` rows (email, reason, date) — read-only.

---

## Technical details

**Files touched**
- `supabase/migrations/<new>.sql` — `unsubscribe_page_config` (single row, default copy seeded), `unsubscribe_feedback`, `newsletter_settings` (single row with `app_base_url`). GRANTs + RLS for all three.
- `supabase/functions/newsletter-unsubscribe/index.ts` — feedback + resubscribe handling, return page config on GET.
- `supabase/functions/send-newsletter/index.ts` — footer guard fix, read `app_base_url` from `newsletter_settings`.
- `supabase/functions/send-welcome-email/index.ts` — same two fixes.
- `src/pages/Unsubscribe.tsx` — render dynamic copy, feedback step, resubscribe button.
- `src/pages/AdminNewsletter.tsx` — new editor section + feedback list.

**Out of scope**
- Changing the email design/branding of the auto-appended footer beyond the bug fix.
- Building a full WYSIWYG for the landing page (plain text fields only).
- Migrating to Lovable Emails (memory says Resend stays — no DNS changes).
