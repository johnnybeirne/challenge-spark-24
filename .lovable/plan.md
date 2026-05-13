## Goal

Make the QA floating panel's mode toggle actually switch the unified Assessment between **Free Training**, **Premium Course**, and **3-Day Challenge** outcomes — without duplicating any pages.

## Root cause

- The current panel exposes a "User Type" pill row (Free / Paid) that only flips `qa.tier` (premium-gating). It does not touch `entryIntent`, so Results keeps the old CTA/destination.
- The "Entry Path" row indirectly sets entry intent, but it's mixed with referral/partner/direct rows and has no explicit "Challenge / Free / Premium" grouping.
- `Assessment.tsx` only writes `entryIntent` once on mount from its `mode` prop. Switching modes mid-session in the panel has no effect because Assessment never re-reads QA state.

## Changes

### 1. `src/lib/qaPreview.ts`
- Add `assessmentMode?: EntryIntent` to `QaPreviewState` (`"free_training" | "premium_course" | "challenge"`).
- Default: `undefined` (no override).
- No removal of existing fields.

### 2. `src/components/QaModePanel.tsx`
- Add a new section **"Assessment Mode"** above "User Type" with 3 pills:
  - `Free Training` → `free_training`
  - `Premium Course` → `premium_course`
  - `3-Day Challenge` → `challenge`
- Clicking a pill:
  - `updateQaState({ active: true, assessmentMode })`
  - `setEntryIntent(assessmentMode)` (so Results picks it up immediately)
  - For `premium_course`, also nudge `tier: "paid"` and `flags.premiumModulesEnabled: true`; for `free_training`/`challenge`, set `tier: "free"` and `premiumModulesEnabled: false`.
- Active state: pill uses the existing `active` styling (primary bg). Same component works on desktop and mobile (already responsive flex-wrap).
- Keep existing User Type / Entry Path sections untouched (they serve other QA needs).

### 3. `src/pages/Assessment.tsx`
- Import `useQaPreview`.
- Replace the single `useEffect` that calls `setEntryIntent(mode)` with an effect that prefers `qa.assessmentMode` when `qa.active && qa.assessmentMode` is set, otherwise falls back to the route's `mode` prop.
- Read the resolved mode (`qa.active && qa.assessmentMode ? qa.assessmentMode : mode`) and use it to:
  - Drive a small label in the header (already-shown QA banner already prints entry, so just ensure the resolved intent is written to sessionStorage on every change).
- No layout, copy, or component changes — same unified UI.

### 4. Results CTA
- No code changes needed: `src/pages/Results.tsx` already reads `sessionStorage["leadio_entry_intent"]` and branches CTA + destination on `free_training` / `premium_course` / else (challenge). Step 3 guarantees the correct value is present whenever the QA toggle changes.

## Verification

- Open QA panel → click "Premium Course" → Assessment header/preview unchanged, banner shows new intent → finish quiz → Results CTA routes to Premium Growth Accelerator.
- Toggle to "Free Training" mid-session → Results CTA routes to Free Training flow.
- Toggle to "3-Day Challenge" → Results CTA routes to 3-Day Challenge flow.
- Active pill is visibly highlighted; works at mobile width (panel already 340px with `flex-wrap`).

## Out of scope

- No new assessment pages or duplicated layouts.
- No changes to scoring, questions, or analytics events.
- No changes to Supabase or auth.
