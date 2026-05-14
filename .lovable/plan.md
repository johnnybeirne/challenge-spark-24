## Goal

Replace the two stacked tables on `/owner-console/waitlist` (Referral Leaderboard + Waitlist) with a single sortable, searchable waitlist table where the top 5 (by confirmed referrals) are visually distinguished.

## Changes to `src/pages/AdminWaitlist.tsx`

1. **Remove the Referral Leaderboard card** (the entire `<Card>` block rendering the leaderboard table). Keep the `leaderboard` calculation only as the source for "valid referral count" per user (used to identify top 5 and to show a column).

2. **Augment each row with `validReferrals`** (count from the leaderboard map). Default to 0 for users with no referrals.

3. **Single unified table** keeps current columns + adds:
   - `Valid referrals` column (sortable) — the deduped count from the leaderboard logic.
   - Default sort changes to `validReferrals desc, waitlist_position asc` so top inviters surface first. User can still re-sort by any column.

4. **Top 5 highlighting** — compute `topFiveIds = leaderboard.slice(0,5).map(x => x.inviter.id)`. For each row in `topFiveIds`:
   - Row background tint: `bg-amber-500/5 hover:bg-amber-500/10`
   - Rank chip in the `#` column: `1` / `2` / `3` / `4` / `5` styled with amber/gold (gold for #1, silver #2, bronze #3, neutral amber for #4–5).
   - Small `Trophy` icon next to name for #1.

5. **Search** already exists — keep it (matches name, email, referral_code, referred_by_code). Add placeholder text "Search name, email, or code…" if missing.

6. **Filters bar** — keep the existing `all / referred / direct / active_inviters` filter chips.

7. **CSV export** — add `valid_referrals` column to the export so it matches what's on screen.

## Top-5 styling tokens

```text
#1  bg-amber-500/10  ring-amber-400/40  text-amber-700
#2  bg-zinc-400/10   ring-zinc-400/40   text-zinc-700
#3  bg-orange-700/10 ring-orange-700/40 text-orange-800
#4  bg-amber-500/5   ring-amber-400/30  text-amber-700
#5  bg-amber-500/5   ring-amber-400/30  text-amber-700
```

## Out of scope

- No schema changes.
- No changes to data fetching or RLS.
- Stats cards at the top stay as-is.
