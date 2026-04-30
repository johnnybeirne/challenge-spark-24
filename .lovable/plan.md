
# Waitlist Referral Engine

## What gets built

A new `/waitlist` page with email signup, unique referral codes, referral tracking, a 6-tier reward ladder, a leaderboard, and a post-signup sharing screen. All data stored in a new `waitlist_signups` table. No existing routes, tables, or functionality are modified.

---

## Database

**New table: `waitlist_signups`**

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | default gen_random_uuid() |
| email | text UNIQUE NOT NULL | |
| name | text | nullable |
| referral_code | text UNIQUE NOT NULL | auto-generated 8-char |
| referred_by_code | text | nullable, the referrer's code |
| confirmed_invites | integer | default 0 |
| current_tier | text | default 'Joined' |
| waitlist_position | integer | serial-like, set on insert |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

**RLS policies:**
- SELECT: public can read all rows (leaderboard needs it)
- INSERT: public can insert (no auth required — this is a waitlist)
- UPDATE: none from client (handled by DB function)

**Database function: `process_waitlist_referral`** (SECURITY DEFINER)
- Called after a new waitlist signup via a trigger
- If `referred_by_code` is set and valid, increments the referrer's `confirmed_invites` by 1
- Recalculates and updates the referrer's `current_tier` based on the tier thresholds

**Database function: `assign_waitlist_position`** (trigger BEFORE INSERT)
- Sets `waitlist_position` to `(SELECT COALESCE(MAX(waitlist_position), 0) + 1 FROM waitlist_signups)`

---

## Frontend

### New file: `src/pages/Waitlist.tsx`

A single-page component with these sections, rendered conditionally based on whether the user has signed up:

**Before signup (landing view):**

1. **Hero** — gradient background, bold headline ("Build a challenge that grows before it even launches"), subheadline, email input + "Join Early Access" button, trust line
2. **How It Works** — 3 icon cards (Join, Get Link, Move Up)
3. **Reward Ladder** — 6 tiers displayed as stacked cards with progress indicators, badge-style labels, locked/unlocked states
4. **Leaderboard** — top waitlist members by confirmed invites, top 3 with gold/silver/bronze styling, movement indicators, placeholder data if empty

**After signup (success view):**

1. Position number + current tier badge
2. Unique referral link with copy button
3. Share buttons (native share API + clipboard fallback using existing `src/lib/share.ts`)
4. Progress bar toward next tier with "X invites away from [next reward]" message
5. Confetti animation (reuse existing `src/components/Confetti.tsx`)
6. The reward ladder (showing current position highlighted)

### Route addition in `src/App.tsx`

Add inside the public routes group (no auth required):
```
<Route path="/waitlist" element={<Waitlist />} />
```

---

## Key implementation details

- The `?ref=CODE` query parameter is read on page load and stored in component state for submission
- Email uniqueness enforced at DB level; duplicate attempts show a friendly "already on the list" message and load their existing record
- Self-referral prevented: if `ref` code matches the signed-up user's own code, `referred_by_code` is set to null
- Tier calculation logic: 0=Joined, 1-2=Starter, 3-4=Mover, 5-9=Builder, 10-19=Accelerator, 20+=Founder
- Leaderboard queries `waitlist_signups` ordered by `confirmed_invites DESC, created_at ASC`, limited to top 20
- Mobile-first responsive design using existing Tailwind theme tokens and color variables
- No authentication required — this is a public waitlist page
- No changes to existing tables, routes, or components
