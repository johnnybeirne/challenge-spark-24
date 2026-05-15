## Goal
A simple newsletter system to compose, send, and track broadcast emails to your waitlist — using the existing Resend setup, with one-click unsubscribe and full send history.

## What you'll get

A new admin page at `/owner-console/newsletter` linked from the existing waitlist admin nav, with three tabs:

1. **Compose & send** — write a one-off broadcast and send it now.
2. **Campaigns** — history of past campaigns with stats (sent / failed / unsubscribes).
3. **Unsubscribes** — list of emails who opted out.

### Compose & send tab
- **Subject** input.
- **Rich text editor** (same TipTap/Quill setup as the existing Waitlist Email page, with the font-size dropdown you just got fixed).
- **Personalisation tokens** auto-substituted per recipient: `{{name}}`, `{{email}}`, `{{unsubscribe_url}}`.
- **Audience picker** with three modes:
  - All active waitlist signups
  - Filter by tier (Founder / Accelerator / Builder / Mover / Starter / Joined) and/or "has 1+ invites"
  - Manually selected — opens a checkbox table of waitlist rows (reuses the AdminWaitlist row data)
- **Live recipient count** updates as you change the audience.
- **Send test** button — sends to one email address you specify.
- **Send campaign** button — confirmation modal showing recipient count, then dispatches.
- Suppressed (unsubscribed) emails are always excluded.

### Campaigns tab
- Table of past sends: subject, sent date, recipients, sent count, failed count, unsubscribe count.
- Click a row to see per-recipient delivery status and any error messages.

### Unsubscribes tab
- List of unsubscribed emails with date and which campaign triggered it.
- Manual "remove from suppression" admin action.

### Unsubscribe page
- New public route `/unsubscribe?token=...` — branded page that confirms opt-out in one click and shows a success message. No login required.

## How the sending works

- Reuses the existing `send-email` Edge Function and `RESEND_API_KEY` — no DNS or provider changes.
- A new Edge Function `send-newsletter` accepts `{ campaignId }`, loads the campaign + recipients, filters out suppressed addresses, then loops through them server-side. For each recipient it:
  1. Substitutes personalisation tokens (including a unique unsubscribe URL with that recipient's token).
  2. Calls Resend.
  3. Logs the result to `newsletter_sends`.
- A small in-function delay (e.g. 100ms between sends) keeps us under Resend's free-tier rate limit. For a small waitlist this completes well within the Edge Function timeout.
- A second Edge Function `newsletter-unsubscribe` handles the public unsubscribe page (validates token → marks suppressed → returns success).

## Database (new tables)

- **`newsletter_campaigns`** — one row per broadcast: `subject`, `html_body`, `audience` (jsonb: mode + filters/ids), `status` (draft/sending/sent/failed), `recipient_count`, `sent_count`, `failed_count`, `unsubscribe_count`, `created_by`, timestamps.
- **`newsletter_sends`** — one row per recipient per campaign: `campaign_id`, `email`, `name`, `status` (pending/sent/failed/skipped_suppressed), `error_message`, `resend_id`, `sent_at`. Used for the per-campaign drill-down.
- **`newsletter_suppressions`** — `email` (unique), `unsubscribed_at`, `source_campaign_id`. Always checked before sending.
- **`newsletter_unsubscribe_tokens`** — `token` (unique), `email`, `created_at`. One token per email; reused across campaigns so unsubscribing once kills all future sends.

All four tables get RLS:
- Admin-only read/write for campaigns, sends, suppressions.
- `newsletter_unsubscribe_tokens`: no client read — Edge Function only (service role).

## Files to add / change

**New**
- `supabase/functions/send-newsletter/index.ts` — dispatcher.
- `supabase/functions/newsletter-unsubscribe/index.ts` — public token validator.
- `src/pages/AdminNewsletter.tsx` — the 3-tab admin page.
- `src/pages/Unsubscribe.tsx` — public unsubscribe confirmation page.

**Edited**
- `src/App.tsx` — add `/owner-console/newsletter` (admin-guarded) and `/unsubscribe` (public) routes.
- `src/pages/AdminWaitlist.tsx` — add a "Newsletter" link to the existing admin nav strip (alongside "Waitlist Email").

## Out of scope (flag if you want them later)
- Scheduled / future-dated sends
- Drip sequences or automations
- Open / click tracking pixels
- A/B subject testing
- Reusable saved templates (current scope: one-off composer per campaign)