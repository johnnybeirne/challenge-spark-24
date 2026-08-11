# Close the two access bypasses (1.1 and 1.2)

Both issues are confirmed against the live database:

- `monthly_points_tracking` has INSERT and UPDATE policies for signed-in users checking only `user_id`, so anyone can write any points total and clear the 500-point access threshold.
- `unlock_grants` has an INSERT policy checking only `user_id` and `source = 'invites'`, so anyone can grant themselves any gate, including paid ones.

Exposure so far looks clean: `unlock_grants` has 0 rows and the highest `points_total` on record is 50, so no evidence of prior exploitation.

## Fix 1: points can only be set by the server

Points are all derived from data the database already holds, so the client never needs to write the total:

- Completing Day 1, 2, 3: `challenge_progress.day_completed_at`
- Invites that joined: `monthly_invite_tracking.invite_count`
- A referral completing Day 1, 2, 3: `referral_day_credits`

Changes:

1. Remove the self-insert and self-update access rules on `monthly_points_tracking`. Reading your own row stays.
2. Add a server-side function `recompute_monthly_points()` that recalculates the caller's total for their current 28-day cycle from the sources above (50 points each, matching `pointRules`) and stores it.
3. Replace `syncMonthlyPoints` in `src/context/AppContext.tsx` so it calls that function instead of writing the row directly. Local points display logic is unchanged.

## Fix 2: unlock grants are validated server-side

1. Remove the client insert rule on `unlock_grants`.
2. Add a server-side function `claim_invite_unlock(gate_key)` that checks the gate is enabled and that the caller's real `profiles.direct_referral_count` meets `unlock_gates.invites_required` before recording the grant. Purchase-sourced grants continue to be written by the payments webhook with the service role.
3. Update `src/hooks/useUnlockGate.ts` to call that function instead of inserting a row. The UI and gate behaviour stay the same.

## Not included

Items 1.3 (`unlocks` cosmetic badge rows), 2.1, 2.2, 2.3 and 2.4 from the review are lower priority and left for a follow-up unless you want them in this pass.

## Technical notes

- Two migrations: policy removal plus the two `SECURITY DEFINER` functions with `search_path = public` and `EXECUTE` granted to `authenticated`.
- Point value of 50 per action is mirrored in SQL; if the rules change later both `src/lib/points.ts` and the function need updating.
- Cycle key is computed with the existing `public.access_cycle_key(profiles.created_at)` function, so cycles stay consistent with the client.
- After the change, a client attempting a direct write to either table is rejected by the database.
