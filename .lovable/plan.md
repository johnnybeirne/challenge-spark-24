## Audit results

I scanned every `localStorage` reference in `src/`. Here is the full inventory grouped by category, with a recommendation for each.

### A. Keep — genuinely device/UI-only (no change)

| File | Key | Why keep |
|---|---|---|
| `src/integrations/supabase/client.ts` | Supabase session | Required by Supabase Auth SDK |
| `src/hooks/useAuth.tsx` | `leadio_post_login_redirect` | Transient redirect across the auth round-trip |
| `src/components/AppShell.tsx` | `SIGNUP_TOAST_KEY` | One-time UI toast flag |
| `src/components/AiCopilotChat.tsx` | `chat_bubble_pos` | Per-device widget position |
| `src/components/QaModePanel.tsx` | `POS_KEY` | QA panel position (dev tool) |
| `src/lib/qaPreview.ts` | `leadioPreviewState` | QA preview overrides (dev tool) |
| `src/pages/AdminContent.tsx` | `admin-content-panel-w` | Admin panel split-pane width |
| `src/pages/AdminTestAccounts.tsx` | `leadio_skip_local_migration` | Transient flag for admin "view as" |
| `src/pages/AdminViewAsUser.tsx` | cleanup of `SETUP_KEY` / `leadio_day1_step` | Same |
| `src/lib/attribution.ts` | `leadio_attribution` + per-event flags | Pre-auth attribution (binds to user on signup; already correct) |
| `src/lib/partner.ts` | partner code | Pre-auth partner capture (already binds to user) |
| `src/components/cms/CmsGlobal.tsx` | scans localStorage | Admin export/import tool, not user data |
| `src/components/DayVideoModal.tsx` | day-modal flag | Already uses `profiles.video_modal_dismissed` when logged in; localStorage is the logged-out fallback only |
| `src/components/auth/SignupChat.tsx` | `challengeos_memory` write | Pre-auth memory capture; migrated to `user_memory` on signup by `migrateLocalToSupabase` |

These are all correct as-is.

### B. Pre-auth fallbacks that already migrate to Supabase on login — keep, but make the migration the source of truth (small fix)

`useSupabaseSync.migrateLocalToSupabase` already moves these into DB on signup and then wipes them:

- `challengeos_assessment` → `ai_user_context.assessment` (just added)
- `challengeos_memory` / `leadio_memory` → `user_memory`
- `leadio_training` → `training_progress`
- `challengeos_challenge` → `challenge_progress`
- `challengeos_unlocks` → `unlocks`

**Fix:** in `src/context/AppContext.tsx`, the writes on lines ~503–522 (saving `state.assessment`, `state.memory`, `state.training` to localStorage on every state change) currently run for **logged-in users too**, which duplicates DB and lets stale local data win. Change the guard so these writes only happen when `!authUser`, i.e. pre-auth only. Remove the post-auth read from localStorage at lines ~485–490 (DB hydration already covers it).

Add `migrateLocalToSupabase` for the new `assessment` so a quiz taken pre-signup persists to `ai_user_context.assessment` at signup.

### C. Real bugs — user data in localStorage that needs to move to Supabase

1. **`src/lib/premium.ts` + `src/hooks/usePremium.ts` — premium flag and coupon**
   `profiles.is_premium` and `profiles.partner_code_used` already exist in the database. Move `isPremiumUser` / `getAppliedCoupon` / `setPremium` to read from / write to `profiles`. `usePremium` becomes a Supabase-backed hook that listens to auth state and the profile row. Keep the `leadio_preview_tier` session override (dev tool, sessionStorage).

2. **`src/pages/RedeemPoints.tsx` — `leadio.unlockedRewards.v1`**
   This is just a local cache of "what milestones the user has reached". It's derived from `state.points.total`, which is already canonical in Supabase. Remove the localStorage cache entirely — compute `unlocked` from `points` on render. No data loss, no UI change.

3. **`src/components/Day1Setup.tsx` + `src/pages/Day1.tsx` — `SETUP_KEY` / `leadio_day1_step`**
   This is the Day 1 wizard's in-progress answers and current step. Today they live in localStorage, so if a user starts Day 1 in one browser and opens another, they lose their place.
   Move the answers into `challenge_progress.ai_outputs.day1Setup` (the column already exists and is synced by `useSupabaseSync`) and the step into `challenge_progress.ai_outputs.day1Step`. Reads come from `state.challenge.aiOutputs`. localStorage stays only as a **pre-auth fallback** (someone fills the form before signing up), and gets migrated into `ai_outputs` on auth.

### D. CMS/content overrides — confirm intent before moving

These two store admin-edited content overrides locally; they're not per-user data but they are persistent state today:

- `src/lib/dayContent.ts` — `leadio_day_content`
- `src/lib/trainingContent.ts` — training content overrides

The canonical home for editable content is `site_content` (already used by `useSiteContent`). These two files look like older parallel stores. Recommend: leave them untouched in this pass — they aren't per-user data, so they don't break cross-device for a single user. Migrating them to `site_content` is a separate cleanup and could change CMS behaviour. Flagging here for visibility.

### E. Out of scope without an explicit decision

- **`src/lib/notifications.ts`** — `leadio_notifications`. These are user-facing toasts/bell entries kept only in localStorage. Moving them to a single source of truth would require a new `notifications` table + RLS + sync. The user-facing behaviour today is "notifications are per-device"; moving to DB would change that. **I will NOT add a new table without confirmation.** Flagging so you can decide.

## Plan

I will implement sections **B** and **C** only. **D** I'll leave alone (separate cleanup); **E** I'll surface in the final message for your decision.

### Files I'll touch

1. `src/context/AppContext.tsx` — gate the assessment/memory/training localStorage reads & writes behind `!authUser`; rely on DB hydration when logged in.
2. `src/hooks/useSupabaseSync.tsx` — extend `migrateLocalToSupabase` to also push `challengeos_assessment` into `ai_user_context.assessment` and the Day 1 wizard draft into `challenge_progress.ai_outputs`.
3. `src/lib/premium.ts` — replace localStorage with `profiles.is_premium` / `profiles.partner_code_used` reads & writes. Keep `leadio_preview_tier` sessionStorage override.
4. `src/hooks/usePremium.ts` — convert to a Supabase-aware hook (subscribe to auth + profile changes, no localStorage).
5. `src/pages/RedeemPoints.tsx` — drop the localStorage cache, compute unlocked milestones from `state.points.total`.
6. `src/components/Day1Setup.tsx` and `src/pages/Day1.tsx` — read/write wizard draft and current step from `state.challenge.aiOutputs` (which is DB-synced). Keep localStorage as a pre-auth fallback only.

### Guardrails

- No changes to scoring (`src/lib/scoring.ts`), points formulae, unlock rules, or any UI styling.
- No new tables; only existing columns are used.
- All pre-auth localStorage writes remain so anonymous flows still work, but they get migrated and then wiped on first authenticated load.
- After the change, signing into the same account on a different browser will surface: archetype, memory, training, challenge progress, unlocks, points/rewards, premium state, Day 1 wizard answers/step.

Want me to proceed?
