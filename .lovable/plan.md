## Presume Quiz Completed When Entering Day 1

### Goal
Anyone landing on Day 1 (`/day/1`) without a saved assessment should be treated as if they took the quiz — so the dashboard score card, gating, and any "did they take the quiz?" checks all behave as if completed.

### Approach
Add a small effect in `src/pages/DayChallenge.tsx` that runs on mount: if `state.assessment` is null/missing, seed a baseline `AssessmentResult` via `generateResult({})` from `src/lib/assessmentData.ts`. This gives a real, valid result shape (with `challengeType`, `diagnosticScore`, `diagnosticLevel`, `recommendedChallenge`, etc.) so every downstream consumer (`DashboardProfileHeader`, `AssessmentResultCard`, Results page) treats them as completed.

### Changes
- **`src/pages/DayChallenge.tsx`**:
  - Import `generateResult` from `@/lib/assessmentData`.
  - Add a `useEffect` (no deps after first run) that checks `!state.assessment` and, if true, calls `setState((prev) => ({ ...prev, assessment: generateResult({}) }))`.
  - This persists to localStorage automatically via the existing `AppContext` save effect (line 485).

### Not changed
- Scoring, layout, gating logic, or the real assessment flow at `/assessment` — users who actually take the quiz still get their real result, which overwrites the seeded default.
- No changes to `AppContext`, `AssessmentResultCard`, or `DashboardProfileHeader`.

### Technical notes
- `generateResult({})` returns valid default values (audienceType: "mixed", challengeType: "quick_win", diagnosticScore computed from empty answers, etc.) so the score card renders a real number + archetype rather than the "Take the quiz" empty state.
- The seed only fires once per session per user — once written, `state.assessment` is non-null and the effect no-ops.