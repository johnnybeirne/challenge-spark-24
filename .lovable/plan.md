## Goal
When the Day 1 Challenge Promise renders (on `/challenge/day-1` read-only view and the dashboard recap), run the assembled sentence through AI to fix grammar, capitalisation and flow — regardless of how the user typed their inputs. Show the polished version with an "Edit" affordance so they can tweak it.

## Approach

### 1. New edge function: `polish-promise`
- Mirrors `tidy-phrase` but accepts the full sentence (audience, pain, result, method) and returns one clean, natural-sounding Challenge Promise sentence.
- System prompt: preserve meaning, keep the "Help [who] move from [pain] to [result] through [method]." shape, fix grammar/casing/articles, don't invent new ideas, return plain text only.
- Uses `google/gemini-2.5-flash-lite` via Lovable AI Gateway (same pattern as `tidy-phrase`).

### 2. Client helper: `src/lib/polishPromise.ts`
- `polishPromise({ who, pain, result, method })` → cached call to the edge function.
- In-memory + `sessionStorage` cache keyed by the raw inputs so we don't re-call on every render.
- Fail-soft: returns the locally-assembled sentence if the call fails.

### 3. New component: `src/components/ChallengePromiseCard.tsx`
Replaces the inline Promise rendering currently duplicated in `src/pages/Day1.tsx` (locked view) and `src/components/YourChallengeRecap.tsx`.

Behaviour:
- On mount, assembles the raw sentence from `aiOutputs` (same source fields used today).
- Stores polished version in `state.challenge.aiOutputs.day1_promise_polished` once received, plus an optional `day1_promise_user_edit` for manual overrides.
- Display priority: user edit → polished → raw assembled → "not available yet".
- Shows a small pencil "Edit" button. Clicking opens an inline textarea with Save / Cancel / Reset to AI version.
- Saves via `setState` (and persists through the existing AppContext → Supabase sync).

### 4. Wire-up
- `src/pages/Day1.tsx`: replace the inline `<Card>` Promise block with `<ChallengePromiseCard />`.
- `src/components/YourChallengeRecap.tsx`: replace the promise row with `<ChallengePromiseCard variant="inline" />` (compact styling, no card chrome).

### 5. Analytics
Add two events to `src/lib/analytics.ts`:
- `promise_polished` — fired once when AI version is stored.
- `promise_edited` — fired when the user saves a manual edit.

## Out of scope
- No changes to Day 1 setup flow itself (we still capture the same fields).
- No backend schema changes — polished + user-edited versions live inside the existing `aiOutputs` JSON blob.
- No changes to QA mode / simulator.

## Files
- new: `supabase/functions/polish-promise/index.ts`
- new: `src/lib/polishPromise.ts`
- new: `src/components/ChallengePromiseCard.tsx`
- edit: `src/pages/Day1.tsx`
- edit: `src/components/YourChallengeRecap.tsx`
- edit: `src/lib/analytics.ts`
