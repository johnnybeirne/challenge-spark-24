# Split Dashboard into Start Here + Your Dashboard

## New information architecture

```
Sidebar / Bottom nav
├── Start Here           ← /challenger-dashboard  (renamed, welcome-only)
├── Your Dashboard       ← /your-dashboard        (NEW — Day 1/2/3 record)
├── Challenge            ← unchanged
├── Unlocks              ← unchanged
└── Earn Rewards         ← unchanged

Account menu
└── Profile              ← contact details only
```

## Start Here (existing `/challenger-dashboard`, slimmed)

Keep only the orientation surface:
- Welcome video card (with Mark as Watched / Watch Again)
- Countdown ("2 days · 23 hours left")
- Primary CTA (Start Day 1 / Continue Day N / View Your Challenge)
- 3-day step strip

Remove from this page (move to Your Dashboard):
- Day 1 answer summaries (niche, audience, promise, challenge title)
- Profile bio / avatar edit card
- Assessment result card
- Signup credits panel

## Your Dashboard (new `/your-dashboard`)

A single page that records everything the user has built. Read-only summary with "Edit on Day X" links back into the challenge flow (no inline editing — keeps AI-derived outputs consistent).

Sections, in order:

1. **Challenge identity** — title from `useChallengeIdentity`, niche, audience, promise, desired outcome (sourced from `aiOutputs.day1_foundation` + `day1_assessment` + `state.memory.desiredOutcome`).
2. **Day 1 — Foundation** — full parsed `day1_foundation` + `day1_assessment` fields. "Redo Day 1" link.
3. **Day 2 — Lead Magnet Quiz** — outputs under `day2_*` keys from `aiOutputs`. Empty state with link to `/challenge/day-2` if not done.
4. **Day 3 — Launch** — outputs under `day3_*` keys + public challenge URL when set. Empty state with link to `/challenge/day-3`.
5. **Progress + timeline** — started_at, ends_at, current day, completed flag.

All read from `state.challenge.aiOutputs` / `state.memory` — no schema changes.

## Profile (`/profile`, slimmed)

Keep only:
- Avatar + name
- Email (read-only)
- Bio
- Contact details section
- Sign out

Remove:
- "Suggested challenge title" card
- Day 1 answer summaries
- Anything sourced from `aiOutputs.day1_*`

## Routing + nav

- Rename sidebar label `"Your Dashboard"` → `"Start Here"` in `src/components/ChallengeSidebar.tsx`.
- Add new sidebar entry `"Your Dashboard"` → `/your-dashboard` directly under Start Here.
- Update `src/components/BottomNav.tsx`: replace the Dashboard tab with two entries OR keep 4 tabs by swapping the Dashboard tab to point to `/your-dashboard` (the more frequently revisited page) and exposing Start Here via the sidebar/header. **Recommend: keep 4-tab rule; bottom nav points to `/your-dashboard`, Start Here lives in sidebar + first-run redirect.**
- Add route in `src/App.tsx`: `<Route path="/your-dashboard" element={<AuthGuard><YourDashboard /></AuthGuard>} />`.
- First-time users (no Day 1 progress) land on `/challenger-dashboard` (Start Here). Returning users with progress can be auto-redirected by `useUserStage` primary CTA — no change needed, CTAs already route into the challenge.

## Files touched

- `src/pages/Dashboard.tsx` — strip down to welcome-only.
- `src/pages/YourDashboard.tsx` — **new**, lifts the Day 1 rendering logic currently in `Profile.tsx` (lines ~116-345) and adds Day 2/3 sections.
- `src/pages/Profile.tsx` — remove Day 1 sections, keep contact details.
- `src/components/ChallengeSidebar.tsx` — rename label, add new entry.
- `src/components/BottomNav.tsx` — repoint Dashboard tab to `/your-dashboard`.
- `src/App.tsx` — register `/your-dashboard` route.
- `src/lib/analytics.ts` — add `your_dashboard_viewed` event (no `as any`).

## Out of scope

- No DB or state-shape changes; everything reads existing `aiOutputs` / `memory`.
- No inline editing of Day 1 answers — users redo a day to change them.
- No changes to challenge identity hook, scoring, or unlock engine.
