## Goal

Add two capabilities to the Newsletter admin:

1. **Save & reuse templates** — store named drafts (subject + body) you can load into Compose with one click.
2. **Welcome automation** — designate one template as the "Welcome email"; every new waitlist signup automatically receives it (with `{{name}}`, `{{referral_url}}`, `{{unsubscribe_url}}` filled in).

---

## Database changes

**New table `newsletter_templates`**
- `name` (label shown in the picker)
- `subject`
- `html_body`
- `is_welcome` (boolean — only one row may be `true` at a time, enforced by partial unique index)
- standard id / created_at / updated_at / created_by
- Admin-only RLS (manage), authenticated read.

**New trigger on `waitlist_signups`**
- After-insert trigger calls `pg_net.http_post` to a new edge function `send-welcome-email`, passing the new signup's id.
- Skips if no template has `is_welcome = true`, or if the email is in `newsletter_suppressions`.

(`pg_net` extension is already available on Lovable Cloud; no migration risk.)

---

## Edge function

**New `send-welcome-email`**
- Input: `{ signupId }`.
- Loads the row, the welcome template, checks suppression, generates an unsubscribe token, runs the same `normalizeBraces → autolinkUrlTokens → substitute` pipeline already used by `send-newsletter`, and sends through Resend.
- Logs into a lightweight `newsletter_sends` row (campaign_id null, so we'll add a nullable `template_id` column on `newsletter_sends` for traceability).
- `verify_jwt = false` (called by DB trigger, not user) — gated by a shared secret header checked against `WELCOME_HOOK_SECRET`.

---

## UI changes (`AdminNewsletter.tsx`)

Add a fourth tab **Templates**:

- List of saved templates (name, subject, "Welcome" badge if active, last updated).
- Row actions: **Load into compose**, **Set as welcome / Unset**, **Delete**.
- Compose tab gains:
  - "Load template…" dropdown at the top of the editor.
  - **Save as template** button next to *Send test* — opens a small dialog asking for a name (or pick existing to overwrite) and a checkbox "Use as welcome email for new signups".

No change to existing campaign send flow.

---

## Verification

1. Create a template, mark it as welcome.
2. Insert a test waitlist signup → confirm welcome email arrives with `{{name}}` / `{{referral_url}}` substituted and clickable.
3. Unset welcome → next signup gets no auto email.
4. Suppressed email signing up again → no auto email, no error.

---

## Out of scope

- Scheduling / drip sequences (only single welcome email).
- Per-tier welcome variants.
- Editing welcome content from a separate "Automations" screen — the Templates tab is the single source of truth.