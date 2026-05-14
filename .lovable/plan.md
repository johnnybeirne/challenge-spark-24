## Short answer

Almost the same — but not exactly. Recommend dropping **Invites** and keeping **Referrals** only.

## What each column actually shows

- **Referrals** — computed live in the page from the signup data. Dedupes by lowercase email, excludes self-referrals, only counts people whose referrer code matches a real user. Trustworthy.
- **Invites** — `confirmed_invites` stored on `waitlist_signups`. A raw counter incremented when someone joins with a referral code. Can drift from reality (duplicates, self-referrals, deleted invitees) — the old leaderboard had a "Review manually" badge for exactly this.

In your current data they happen to match, but they can diverge.

## Plan

Edit `src/pages/AdminWaitlist.tsx`:

1. Remove the **Invites** column from the table header.
2. Remove the matching `<td>` cell from each row.
3. Remove `confirmed_invites` from the CSV export.
4. Keep **Referrals** as the single source of truth (already sortable, already used for top-5 ranking).
5. Keep the "Active inviters" stat card at the top — it's a useful signal and stays based on `confirmed_invites > 0`.

## Out of scope

- No DB changes. `confirmed_invites` stays in the table for backend logic; we just stop showing it on screen.
