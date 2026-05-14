## Goal

After someone joins the waitlist, do NOT show their referral link on screen. Instead, show a calm "Check your inbox" confirmation, and email them their personal invite link.

## Scope

Only `/waitlist`. No changes to other pages, the admin console, or the database schema. Reuses the existing `send-email` Edge Function (Resend) that the project already runs.

## UX changes (`src/pages/Waitlist.tsx`)

After a successful signup (new or already-existing email), replace the current success card with a simpler "check your inbox" state:

- Headline: "You're on the list"
- Body: "We just sent your invite link to **{email}**. Open it to share with friends and move up the queue."
- Small line: "Don't see it? Check spam or promotions."
- Optional secondary action: "Use a different email" (resets the form)

Remove from the post-signup view:
- The position number badge
- The visible referral URL field + copy button
- The "Share invite link" button
- The inline "Invite 3 people to unlock earlier access" line (now lives in the email)

The pre-signup hero (name + email + "Join Early Access" button + trust line + activity feed) and the "How it works" cards stay exactly as they are.

The Final CTA section keeps its current behavior:
- If not signed up: "Join Early Access" scrolls to top
- If signed up: hide the section (no share button without the link visible)

## Email (uses existing `send-email` function)

After the insert succeeds (or duplicate is detected), invoke `send-email` with:
- `to`: signup email
- `subject`: "You're on the early access list"
- `html`: a clean branded message containing
  - greeting (uses first name if provided)
  - confirmation they're on the list
  - their personal invite link `https://.../waitlist?ref={code}`
  - one-line "Invite 3 people to unlock earlier access"
  - signature

If the email send fails, the user still sees the "check your inbox" state (we don't want to block confirmation), but we log the error and show a quiet toast: "We saved your spot — if the email doesn't arrive, contact support." Idempotent for duplicates: the existing user gets the same email re-sent so they always have their link in their inbox.

## What does NOT change

- Database schema, RLS, position/invite counts, admin page
- `/challenge` page and shared `ActivityFeed`
- `WaitlistActivityFeed` component
- Referral code generation and `referred_by_code` capture from `?ref=`
- Confetti trigger on first successful signup

## Technical notes

- Reuses `supabase.functions.invoke('send-email', { body: { to, subject, html } })` — no new Edge Function, no new secrets, no migration.
- Drops unused imports (`Copy`, share helper) from `Waitlist.tsx`.
- Keeps `signedUp` state so the form swap still works; we just render the new minimal confirmation card instead of the link card.
