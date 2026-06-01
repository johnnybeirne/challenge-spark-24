## The actual problem

You're right — I patched the wrong layer. The flow is: **Quiz → Signup → Challenge dashboard**. By the time someone is on `/challenger-dashboard`, they've already completed the quiz. The "Take the quiz" card should never appear there.

The reason it shows: `state.assessment` is **only saved to localStorage**, never to the backend.

- `src/pages/Assessment.tsx` writes the result into `state.assessment`.
- `src/context/AppContext.tsx` persists `challengeos_assessment` to `localStorage`.
- Nothing writes the full assessment to Supabase, and nothing hydrates it back on login.

So if the user signs in on a different browser, clears storage, or arrives via an admin "view as" session, the dashboard has no assessment to read — and the strip falls back to "Take the quiz", even though they're mid-challenge.

`ai_user_context` is written by `src/lib/aiContext.ts`, but it only stores stale/derived fields (`assessment_type`, `assessment_score`) that don't match the real shape (`diagnosticScore`, `diagnosticLevel`, `challengeType`), and it's never read back.

## Plan

### 1. Persist the real assessment to the backend

Add an `assessment jsonb` column to `public.ai_user_context` (nullable, default `null`). Store the full `AssessmentResult` object there on completion — that's the same shape `state.assessment` already uses, so no mapping work needed downstream.

Update `src/lib/aiContext.ts` (or the Assessment completion handler) to upsert the full assessment JSON into that column whenever it changes.

### 2. Hydrate `state.assessment` from the backend on login

In `src/context/AppContext.tsx` (or `useSupabaseSync`), when the user is authenticated and `state.assessment` is empty, fetch `ai_user_context.assessment` and set it into state. Backend wins over localStorage when both exist.

### 3. Fix the dashboard strip

In `src/components/DashboardArchetypeStrip.tsx`:

- While the assessment is still loading (auth resolved, hydration in-flight), render a quiet skeleton — not the "Take the quiz" CTA.
- If the user is inside the challenge (has `challenge_progress` / is on the challenger dashboard) and somehow still has no assessment, render a neutral welcome header with **no quiz CTA** (the quiz is upstream of signup — surfacing it here is wrong).
- Keep the existing "live" version (archetype name, score, "Review diagnosis" link) for the normal case.

The "Take the quiz" fallback should only ever appear on pre-signup surfaces, not on `/challenger-dashboard`.

## Technical notes

- Migration: `ALTER TABLE public.ai_user_context ADD COLUMN assessment jsonb;` — no new table, no new RLS work (existing policies cover it).
- Write path: extend the existing upsert in `src/lib/aiContext.ts` to include `assessment: state.assessment`.
- Read path: small one-shot select on auth, merged into `state.assessment` if local is empty.
- No changes to scoring, Results page, or the admin editor for diagnostic responses.

Want me to proceed with this?
