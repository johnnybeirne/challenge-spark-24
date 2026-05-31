## Why you're seeing "Your Challenge Promise isn't available yet"

The locked Day 1 read-only view in `src/pages/Day1.tsx` builds the promise **only** from `localStorage["leadio_setup"]` (`SETUP_KEY`). That local key is wiped in three common situations, even though Day 1 was actually completed:

1. Loading the app in a different browser / device / incognito (localStorage is per-browser, not synced).
2. Admin "View as user" demo mode — `useLaunchDemoUser` explicitly removes `SETUP_KEY` before launching.
3. After a `clearState()` / sign-out / browser data clear.

When `leadio_setup` is missing, `saved` is `null`, every field is empty, so `hasPromise = false` and the fallback message renders — even though the canonical data (`state.memory.audienceType`, `memory.challengeType`, `memory.topic`, `memory.desiredOutcome`) and `state.challenge.aiOutputs.day1_foundation` / `day1_assessment` are still in Supabase and hydrated into app state.

A secondary bug: even when `leadio_setup` *is* present, the `methodMap` keys are the raw setup values (`"quick-win"`, `"solve-problem"`, etc.). The memory-stored `challengeType` is normalized (`"quick_win"`, `"transformation"`, …) so it would not match the map.

## Fix

Rewrite the promise derivation in the `isLocked` branch of `src/pages/Day1.tsx` to prefer canonical app state and fall back to localStorage:

1. **Who** — try in order:
   - `state.memory.topic`
   - parsed `state.challenge.aiOutputs.day1_assessment.transformation`
   - parsed `day1_foundation.audience`
   - `saved.topicHint` / `saved.audience`

2. **Pain** — try in order:
   - parsed `day1_assessment.problem` / `day1_foundation.problem`
   - `saved.problem`

3. **Result** — try in order:
   - `state.memory.desiredOutcome`
   - `saved.outcome` / `saved.how`
   - parsed `day1_foundation.how`

4. **Method phrase** — build a `methodMap` keyed by **both** raw setup values and normalized memory values so either source resolves:
   - `"solve-problem"` and `"transformation"` → "a focused, problem-solving structure…"
   - `"quick-win"` and `"quick_win"` → "a fast, action-led plan…"
   - `"create-asset"` and `"skill_builder"` → "a build-as-you-go process…"
   - `"reach-milestone"` and `"launch"` → "a step-by-step path…"
   - Resolve from `saved?.challengeType` first, else `state.memory.challengeType`.
   - If still unknown but Day 1 is complete, fall back to `"a clear, day-by-day structure"` so the sentence still renders.

5. Keep the existing "Day 1 Complete" header, the Challenge Promise card, and the "Go to dashboard" button unchanged.

No changes to Day 1 setup logic, no changes to Supabase schema, no changes to Dashboard. Frontend-only edit to one file: `src/pages/Day1.tsx`.

## Out of scope

- Persisting `leadio_setup` to Supabase (canonical state already covers it; no need to duplicate).
- Changing how the Dashboard renders the promise.
