# Access cycles: rolling 28 days from signup, not calendar months

Today the points target resets on the 1st of each calendar month. It should instead run in repeating 28 day cycles anchored to the day the participant signed up. Someone who joins on the 9th has a cycle running 9th to 6th (28 days later), then the next 28 days, and so on forever.

## Behaviour after the change

- Each participant has their own cycle window, derived from their signup date.
- 500 points must be earned inside the current 28 day window to keep access free.
- When a window ends, the counter starts again at 0 for the next window. If the finished window fell short and the participant is not on the paid plan, access locks.
- All participant facing copy stops saying "this month" or naming a month, and instead says "this cycle" with the cycle end date, plus a "X days left in this cycle" line.

## Technical detail

Anchor date: `profiles.created_at` for the signed in user (falls back to the auth user creation time if a profile row is somehow absent).

1. New shared helper `src/lib/accessCycle.ts`
   - `CYCLE_DAYS = 28`
   - `getCycle(signupAt, now)` returns `{ index, startsAt, endsAt, daysLeft, key }` where `key` is the cycle start as `YYYY-MM-DD`.
   - `getPreviousCycle(...)` for lockout checks.

2. Storage: keep the `monthly_points_tracking` and `monthly_invite_tracking` tables and their `(user_id, month)` unique keys, but the `month` value becomes the cycle start date key (`YYYY-MM-DD`) instead of `YYYY-MM`. No schema migration needed; old `YYYY-MM` rows simply stop being read. A short data note: existing rows are left in place as history.

3. `src/context/AppContext.tsx` — `currentMonthKey`/`syncMonthlyPoints` become cycle based: load the user's signup date, compute the current cycle, sum only point activity with a timestamp inside `[startsAt, endsAt)`, and upsert against the cycle key.

4. `src/hooks/useAccessStatus.ts` — read the signup date, compute current and previous cycle keys, and query those two rows. `hasAccess` unchanged in shape. The grace period becomes: the first 24 hours after the participant's own cycle rollover (not the 1st of the month). Returns gain `cycleEndsAt` and `daysLeftInCycle`.

5. `src/hooks/useReferralStats.ts` — same cycle key instead of `monthKey`.

6. Scheduled job `supabase/functions/monthly-invite-reset` — renamed in behaviour, keeps the same route. It runs daily and processes only users whose cycle rolled over in the last 24 hours: join each tracking row to the owner's signup date, evaluate the just finished cycle, mark `locked_out` when under 500 points and not premium, otherwise `active`. The cron schedule moves from monthly to daily.

7. Copy updates, replacing month language with cycle language:
   - `src/components/AccessPageTemplate.tsx`: "{pointsTotal} of 500 points this cycle", "{daysLeft} days left in this cycle", remove the duplicated month line, footnote reads "per 28 day cycle".
   - `src/components/access/AccessLockedScreen.tsx` and `AccessGraceBanner.tsx`: same wording.
   - `src/pages/InviteFriends.tsx`: "This cycle" card with the end date instead of the month name.
   - Any remaining "per month" / "monthly" phrasing on these access surfaces becomes "per 28 day cycle".

The $97 paid option stays a monthly subscription and its copy is unchanged.
