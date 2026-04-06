
## Reconciliation Plan

### 1. AppState & User types (AppContext.tsx)
- Add canonical `User` interface with `role`, `adminBoost`, `adminBadge`, `submittedUrl`
- Add `onboarding`, `crossPromotion`, `partnerAsset`, `partnerPerformance` to AppState
- Remove top-level `communityUnlocked` (redundant with `community.unlocked`)
- Remove `referrals.shares` and `referrals.invites` (not in canonical)
- Remove `community.submittedUrl` (moved to `User.submittedUrl`)
- Remove `partner: PartnerState` from AppState (promoter hook handles this)

### 2. Scoring — one formula
- Add `adminBoost` to `calculateLeaderboardScore`
- Add `calculatePromotionScore` and `getVisibilityLevel` to canonical location
- Remove duplicate scoring in PartnerDashboard, PartnerPerformance, Community

### 3. Routes
- Remove `/features` (not canonical)
- Remove `/invite-builders` (not canonical)
- Rename `/partner` → `/promoter`
- Keep `/partner/performance`
- Remove admin routes `/admin/promoters`, `/admin/activity-feed`; keep `/admin/analytics`

### 4. Bottom Nav
- Remove "Ranks" (5th tab) — canonical says 4 tabs only
- Remove promoter tab from bottom nav (canonical says card on Dashboard)

### 5. Analytics events
- Replace event list with canonical 35 events
- Update all `trackEvent` calls to use canonical names
- Remove `as any` casts from trackEvent calls

### 6. Component cleanup
- Update Referrals page to remove `shares`/`invites` references
- Update DayChallenge to remove `shares`/`invites` references
- Update Community to use canonical state shape
- Fix all type errors from state shape changes

### 7. Persistence keys
- Update `STORAGE_KEYS` in useSupabaseSync to match canonical list
- Update `clearState()` in AppContext

### Files modified:
- `src/context/AppContext.tsx` — major refactor
- `src/lib/analytics.ts` — canonical events
- `src/App.tsx` — route cleanup
- `src/components/BottomNav.tsx` — 4 tabs
- `src/pages/Referrals.tsx` — remove shares/invites
- `src/pages/DayChallenge.tsx` — remove shares/invites
- `src/pages/Community.tsx` — align with canonical state
- `src/pages/Dashboard.tsx` — minor fixes
- `src/pages/PartnerDashboard.tsx` — use canonical scoring
- `src/pages/PartnerPerformance.tsx` — use canonical scoring
- `src/hooks/useSupabaseSync.tsx` — canonical keys
