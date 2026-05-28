## Goal

On `/owner-console/bios`, stop treating profile users and waitlist members as two separate lists. When the same email exists in both `profiles` and `waitlist_signups`, show **one merged row** that keeps every detail from both — including how they were referred and their waitlist stats.

## Behavior

- One row per unique email.
- Sources shown as badges: `Buyer`, `Waitlist`, or both (`Buyer + Waitlist`) when merged.
- Bio + socials: prefer the non-empty value, with profile winning on ties (since that's the editable account record).
- Always surface waitlist referral context when present:
  - Referral code (their own share link code)
  - Referred by (the inviter's code/email if we can resolve it)
  - Confirmed invites + current tier
  - Waitlist position
- Joined date = earliest `created_at` across the two records.

## Edit behavior

- The edit dialog saves to **both** underlying records when they exist (profile + waitlist), so bio/socials stay consistent everywhere they're displayed (leaderboard, waitlist thanks page, etc.).
- If only one source exists, save updates only that one (current behavior).

## Technical notes

In `src/pages/AdminBios.tsx`:

1. Extend the waitlist `select` to include `referral_code, referred_by_code, confirmed_invites, current_tier, waitlist_position`.
2. Replace the "filter waitlist out if email exists in profiles" logic with a merge keyed by lowercased email:
   - Build a `Map<email, BioRow>` from profiles.
   - For each waitlist row, if email matches, merge into the existing row (fill empty fields, attach waitlist-specific stats, mark `sources: ["profile","waitlist"]`, keep both ids: `profileUserId` + `waitlistId`).
   - Otherwise push as a new waitlist-only row.
3. Update `BioRow` type: replace `source: Source` with `sources: Source[]`, add `profile_user_id?`, `waitlist_id?`, and the waitlist referral fields.
4. Update row rendering to show badges for each source and a small referral block (code, referred-by, invites/tier, position) when waitlist data is present.
5. Update `save()` to update profile (by `profile_user_id`) and waitlist (by `waitlist_id`) in parallel when both exist.
6. Keep existing filters/sort untouched — they already operate on the merged `rows` array.

No DB migration needed. RLS already allows admin reads/writes on both tables.
