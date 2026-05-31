Finish the remaining Day 1 threading polish in `src/components/Day1Setup.tsx`. No new files, no logic changes.

## 1. Wire `navLoading` to the Continue buttons

Step 2 (problem → reaction call) and Step 9 (outcome → promise call) already trigger AI calls in `handleFoundationNext(2)` and `handleOutcomeNext`, but the buttons don't show progress. Update both:

- Step 2 Continue button: `disabled={!problem.trim() || navLoading === "problem"}`, swap label/icon to a `Loader2` spinner + "Thinking…" when `navLoading === "problem"`.
- Step 9 Continue button: same pattern with `navLoading === "outcome"` and "Crafting your promise…".

Use the existing `Loader2` lucide icon (already imported elsewhere in the file; add if missing).

## 2. Polish template callbacks for steps 5 and 9

Add one short Johnny line that quotes the user's prior answer so each new step feels continuous:

- **Step 5 (audience refinement / segment):** prepend a one-liner that references the Step 1 audience (`audience`) — e.g. `"Got it — ${audienceShort}. Let's zoom in."` rendered above the existing question.
- **Step 9 (outcome):** prepend a one-liner that references the Step 3 process (`how`) — e.g. `"Love that approach. Now the payoff —"` before the outcome prompt.

Keep both as pure template strings (no AI call), use the same `TypedSequence` pattern already used on other steps, and truncate the quoted snippet to ~60 chars with an ellipsis so long answers don't break layout.

## 3. Verification

- Read the file after edits to confirm buttons render the spinner state.
- Confirm no TypeScript errors via the auto build.
- No scoring, sequencing, or state-shape changes.

Scope is limited to Day1Setup.tsx UI polish.