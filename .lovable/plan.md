# Catch self-referrals on the waitlist

## Goal
People are referring themselves using a second email address (e.g. Catherine on the waitlist now). We'll capture cleaner data on signup and automatically flag suspicious referrals in the admin view, without blocking anyone.

## What changes for the user filling in the waitlist form

The form on `/waitlist` will go from **one Name field** to **two fields**:
- First name (required)
- Surname (required)

That's the only visible change. Submission still works the same way.

## What changes in the database

Add three new columns to `waitlist_signups`:
- `first_name` (text)
- `surname` (text)
- `signup_ip` (text) — captured server-side
- `suspected_self_referral` (boolean, default false)
- `self_referral_reasons` (text array) — e.g. `{same_local_part, name_in_email, same_ip}`

Backfill `first_name` from the existing `name` column (split on first space) so old records aren't blank. Keep `name` as a computed convenience for display ("First Surname").

## How the self-referral check works

A new database trigger runs every time someone joins the waitlist with a `referred_by_code`. It compares the new signup against the referrer's record and sets `suspected_self_referral = true` if **any** of these match:

1. **Same email local-part** — `catherine@x.com` referring `catherine@y.com`
2. **Email contains referrer's first name or surname** — Catherine referring `csmith2024@gmail.com` or `catherineb@…`
3. **Same surname** — likely family, flagged but kept
4. **Same signup IP** — same browser/device joining twice

The signup still goes through and still counts toward the referrer's tier — we're not punishing anyone automatically. You decide in admin.

## What changes in the admin view (`/admin/waitlist`)

- New **"⚠ Flagged"** column showing a warning chip on suspicious rows, with a tooltip listing the reasons.
- New filter toggle: **"Show flagged only"**.
- Each flagged row gets two actions:
  - **Mark as valid** — clears the flag.
  - **Void referral** — sets `referred_by_code` to null, decrements the referrer's `confirmed_invites`, and recalculates their tier.

## Capturing IP

The waitlist insert moves through a small edge function (`waitlist-join`) so we can read the request IP from headers (`x-forwarded-for`). The function does the insert with the service role, then returns the new row. Existing CORS + validation pattern.

## Technical notes

- **Schema migration**: add columns, backfill `first_name`/`surname` by splitting current `name`, create trigger `flag_self_referral()` running on `BEFORE INSERT` on `waitlist_signups`.
- **Edge function `waitlist-join`**: validates payload with zod (`first_name`, `surname`, `email`, `referred_by_code?`), pulls IP from `x-forwarded-for`, inserts row, returns it. Replaces the direct `supabase.from("waitlist_signups").insert(...)` call in `src/pages/Waitlist.tsx`.
- **Form**: `Waitlist.tsx` updated to two inputs; `name` field is constructed as `${first} ${surname}` for backward compatibility with email templates that use `{{name}}`.
- **Admin**: `AdminWaitlist.tsx` adds the flagged column, filter, and the two row actions (RPC `admin_clear_self_referral_flag` and `admin_void_waitlist_referral`).
- Nothing changes for the main app referral system (`profiles.referred_by`) — this is waitlist-only for now. If you want the same logic applied to authenticated signups later, it's a separate pass.

## Out of scope

- Blocking signups (you chose "allow but flag").
- Email-domain fuzzy matching beyond local-part (e.g. typo detection) — can add later if needed.
- Backfilling flags on the existing ~hundreds of waitlist rows. We can run a one-off pass after the trigger lands if you want — say the word.
