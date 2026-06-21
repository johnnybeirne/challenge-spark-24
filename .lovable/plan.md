# Strategy-Doc Alignment Plan

Based on a full audit of the codebase against `lovable-app-audit.md`. Skipping cosmetic items; focusing on the 4 HIGH gaps and 2 MEDIUM gaps that affect conversion, fraud prevention, and the viral loop.

## Current state at a glance

| # | Requirement | Status |
|---|---|---|
| 1 | Quiz with AI advice | Works, but 9 questions (spec: 5–7) and no dedicated AI Advisor Panel |
| 2 | Email + IP fraud prevention | Only covers waitlist; main challenge signup has no IP check; IP stored plaintext |
| 3 | 3-day countdown | Done |
| 4 | Day 1 personalised dashboard | First name + tick-boxes + copilot present; quiz score not surfaced |
| 5 | Day 2/3 lock screen with 2 pathways | Lock screen lacks both inline buy CTA and "invite 3 friends" CTA |
| 6 | Points system | Signup + join points fire; quiz-completion gate for referral points never executes |
| 7 | Referral link + friends list | Uses `/assess?ref=`; no friends-with-status UI |
| 8 | Minimal video | Infra exists; not a blocker |

## What to build (in order)

### HIGH 1 — Lock screen dual pathway (Req 5)
In `src/pages/DayChallenge.tsx` `LockedDayScreen` (lines ~769–818), add two clearly separated CTAs above the countdown:
- Premium pathway: inline "$497 — Unlock Day {n} now" button that opens `StripeEmbeddedCheckout` in a modal (reuse `src/components/StripeEmbeddedCheckout.tsx`) instead of routing away.
- Viral pathway: live "X / 3 referrals" progress bar reading `state.network.direct`, with a "Copy referral link" button (reuse `EarnRewards` link generator). When the user hits 3 direct referrals, unlock Day 2 immediately via the existing `canAccessDay` path.

### HIGH 2 — Referral points fire on referred-friend quiz completion (Req 6)
In `src/context/AppContext.tsx` `awardPoints` flow, stop awarding `referral_join_*` purely from `state.network.direct` count. Instead:
- Add a server-side trigger on the assessment-submit edge function (or `Assessment.tsx` completion handler) that calls a new `referral_quiz_complete` action.
- That action looks up the inviter via the stored `challengeos_ref`, increments their referral-complete count, and awards 50 pts using the existing `awardPoints` engine.
- Wire `pointRules.referral_day_1` / `referral_day_2` (already declared in `src/lib/points.ts:43-44`) into `applyPointRules`.

### HIGH 3 — IP fingerprinting on challenge auth signup (Req 2)
- New edge function `signup-fingerprint` (or extend `waitlist-join`) that the challenge signup calls right after Supabase Auth creates the user. It hashes the IP (`sha256(ip + salt)`) and writes to a new `profiles.signup_ip_hash` column.
- Add a unique-ish guard: if same `signup_ip_hash` already exists with a different email and `< 24h` old, block with friendly error (consistent with the "no restart loops" rule).
- Backfill: change existing `waitlist_signups.signup_ip` to also store hash (new column, keep raw nullable for now, deprecate later).

### HIGH 4 — AI Advisor Panel (Req 1 + Req 4)
- New `src/components/AIAdvisorPanel.tsx` rendered on `Results.tsx` (post-quiz) and on `Day1.tsx` dashboard.
- Reads `state.assessment` + first name, calls existing `polish-*` style edge function (or a new `advisor-insight` function) to return 3 personalised insights tied to the user's lowest-scoring quiz dimensions.
- Cached per-user so repeated renders don't re-bill.

### MEDIUM 1 — Surface quiz score on Day 1 (Req 4)
In `Day1Setup.tsx`, add a compact "Your assessment: 67/100 — Builder tier" card pulled from `state.assessment.percentageScore` + `getDiagnosticResult().tier`.

### MEDIUM 2 — Friends-with-status list (Req 7)
On `EarnRewards.tsx`, render the existing `state.referrals` array as a list (name initial + masked email + status badge: Joined / Quiz done / Day 1 done). Pulls directly from the AppContext referrals slice.

## Out of scope (deferred)

- Trimming quiz from 9 → 5 questions (would invalidate existing scoring + cohort comparisons; needs product call).
- Per-day 24h expiry for Day 1 (current 72h window is acceptable).
- Video duration enforcement (CMS-side concern).
- Renaming referral links from `/assess?ref=` to `/join?ref=` (would break existing in-flight links; low value).

## Technical notes

- All new RLS-bound tables/columns will include the standard `GRANT … TO authenticated; GRANT ALL … TO service_role;` block.
- Stripe modal on lock screen reuses existing `useStripeCheckout` hook — no new Stripe wiring.
- AI Advisor calls go through Lovable AI Gateway, no new keys.
- Referral-quiz-complete handler must be idempotent (same ref + same new user = one award).

Confirm and I'll implement HIGH 1 → HIGH 2 → HIGH 3 → HIGH 4 → MEDIUMs, verifying each before moving on.
