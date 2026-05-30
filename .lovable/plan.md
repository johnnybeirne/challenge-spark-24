# Rename `credits` → `points`

Rename the internal reward-system terminology from "credits" to "points" everywhere it refers to the gamification/reward ladder. Unrelated uses of the word "credit" stay as-is.

## Scope

### In scope (rename)
The points/credits reward system: balance, ledger, tiers, redemption, and the UI/labels around it.

Files involved:
- `src/lib/credits.ts` → **rename to `src/lib/points.ts`** (32 hits — tiers, point math, types)
- `src/context/AppContext.tsx` (29 hits — `state.credits`, reducers, types)
- `src/components/CreditStatusCard.tsx` → **rename to `src/components/PointStatusCard.tsx`** (20 hits)
- `src/pages/RedeemCredits.tsx` → **rename to `src/pages/RedeemPoints.tsx`** (21 hits)
- `src/pages/Unlocks.tsx` (15 hits)
- `src/pages/Dashboard.tsx` (8 hits)
- `src/pages/EarnRewards.tsx` (6 hits)
- `src/App.tsx` (2 hits — route + import)
- `src/components/AppShell.tsx` (2 hits)
- `src/components/RightRail.tsx` (`state.credits?.total`)
- `src/components/ChallengeSidebar.tsx` — only the credits-system reference, NOT "No credit card required"
- `src/pages/UserFeaturesAudit.tsx` — "Redeem credits", "Earn Credits"
- `src/lib/featureOverview.ts` — the reward-system mentions
- `src/pages/blueprint/BlueprintDashboard.tsx` — `state.credits?.total`
- `src/hooks/useIsChallengerShell.ts` — route reference

Route change:
- `/redeem-credits` (and/or `/redeem`) → `/redeem-points`. Old route kept as a redirect to avoid breaking shared links.

### Out of scope (leave untouched)
These uses of "credit" are unrelated to the reward system:
- "No credit card required" — `ChallengeSidebar.tsx`, `BlueprintLanding.tsx`, `BlueprintSignup.tsx` (×2)
- "AI credits exhausted…" — `supabase/functions/blueprint-insight/index.ts` (Lovable AI Gateway language)
- "more credits and flexibility" (Pro account marketing copy) — `DayChallenge.tsx`
- "Coupon-driven sales credit your account…" — `PartnerDashboard.tsx` (verb, attribution)
- "they credit you for it" — `assessmentData.ts`
- "Your referrals, credits, and other…" in `Day1.tsx` — **flag for review**: ambiguous, likely should change to "points" too, will confirm in implementation.

## Naming rules

Case-preserving rename:
- `credits` → `points`
- `Credits` → `Points`
- `CREDITS` → `POINTS`
- `credit` (singular, reward-system only) → `point`
- `Credit` → `Point`
- `CreditStatusCard` → `PointStatusCard`
- `RedeemCredits` → `RedeemPoints`
- `creditTiers`, `addCredits`, `creditLedger`, etc. → `pointTiers`, `addPoints`, `pointLedger`
- AppContext: `state.credits` → `state.points` (object shape `{ total, ledger, … }` keeps same fields, just renamed at the top level)
- LocalStorage keys touching credits: migrate on load (read old key once, write new key) so existing users don't lose balances.

## Technical notes

- Rename `src/lib/credits.ts` → `src/lib/points.ts` and `src/components/CreditStatusCard.tsx` → `src/components/PointStatusCard.tsx` and `src/pages/RedeemCredits.tsx` → `src/pages/RedeemPoints.tsx`. Update every import path.
- `AppContext` is the canonical state per project memory. Update the reducer action names (`ADD_CREDITS` → `ADD_POINTS`, etc.), the state slice key, and the persisted-storage key with a one-time migration:
  ```ts
  const legacy = localStorage.getItem('leadio.credits');
  if (legacy && !localStorage.getItem('leadio.points')) {
    localStorage.setItem('leadio.points', legacy);
    localStorage.removeItem('leadio.credits');
  }
  ```
- `src/App.tsx`: add the new `/redeem-points` route; keep `/redeem-credits` (and `/redeem` if present) as `<Navigate>` redirects to the new path.
- Update the index memory note that currently says "Redeem Credits page" to "Redeem Points page".
- No Supabase schema columns are named `credits` (verified — only edge-function string referenced AI credits). No DB migration needed.

## Verification

- `rg -n "credit" src/` returns only the out-of-scope strings listed above.
- App boots, `/redeem-credits` redirects to `/redeem-points`, points balance survives reload (localStorage migration works), Unlocks / Dashboard / EarnRewards render points totals.
