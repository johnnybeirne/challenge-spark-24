## Goal

Add a cumulative recap beneath Johnny B AI's message on **every** Day 1 step (after the first). Each prior answer renders on its own labelled line — never combined. Pull values from existing profile state (`echoMap`). No question/step/flow changes.

## Step sequence and what each recap shows

Canonical Day 1 order is `4 → 1 → 10 → 5 → 2 → 3 → 9 → 7 → 8`. The recap on each step shows every answer captured before that step:

| Step | Question being asked | Recap rows shown above the question |
|------|----------------------|-------------------------------------|
| 4 | Audience type (b2b/b2c) | — (first step, nothing to show) |
| 1 | Who specifically you serve | — (audience type pick is implied by next answer) |
| 10 | Superpower | You work with: {audience} |
| 5 | Challenge type | You work with / Your superpower |
| 2 | Specific problem | + Your goal |
| 3 | Your process | + The problem |
| 9 | Outcome | + Your process |
| 7 | Review / promise | + The result |

Step 8 is the final locked promise view — unchanged.

## Implementation

All edits in `src/components/Day1Setup.tsx`.

1. **Add one helper inside the component** (near the existing `echoMap`):

   ```ts
   const recapRowsBefore = (step: number): RecapRow[] => {
     const rows: RecapRow[] = [];
     const push = (when: boolean, label: string, echo: EchoField) => {
       if (when) rows.push({ label, echo });
     };
     // Order matches the user's flow so lines stack chronologically.
     push(step !== 4 && step !== 1 && !!audience.trim(),     "You work with:",   "audience");
     push(step !== 4 && step !== 1 && step !== 10 && !!superpower.trim(),
                                                              "Your superpower:", "superpower");
     push(["2","3","9","7"].includes(String(step)) && !!challengeType,
                                                              "Your goal:",       "challengeType");
     push(["3","9","7"].includes(String(step)) && !!problem.trim(),
                                                              "The problem:",     "problem");
     push(["9","7"].includes(String(step)) && !!how.trim(),   "Your process:",    "how");
     push(step === 7 && !!outcome.trim(),                     "The result:",      "outcome");
     return rows;
   };
   ```

   `RecapCard` already hides rows whose `echoMap` value is empty, so this stays safe if a field is missing.

2. **Render `<RecapCard rows={recapRowsBefore(step)} echoMap={echoMap} />` directly below Johnny's message** on each step that currently lacks one:

   - Step 1 (`step1Phase === "input"`) — below the `StaticAi` message
   - Step 10 — below the `StaticAi` message
   - Step 5 — below Johnny's prompt, above the challenge-type cards
   - Step 2 — below the `StaticAi` message
   - Step 7 — below the existing promise message (in addition to the existing summary)

3. **Steps 3 and 9** already use `JohnnyRecapPanel` with their own row arrays. Replace those local arrays with `recapRowsBefore(3)` / `recapRowsBefore(9)` so labelling is consistent and cumulative across the whole flow.

4. **Labels** match the user's example ("You work with:", "Your superpower:") and drop the trailing "is/are" form. The existing `audienceLabel` helper used only by step 3/9 recaps becomes unused and can stay or be deleted later — no behavior change either way.

5. **No other changes**: the questions, placeholders, input fields, navigation, persistence, `echoMap`, and pencil-edit affordances stay exactly as they are. `RecapCard` already wraps each value in `EchoText`, so inline pencil-editing continues to work in the new recap rows too.

## Out of scope

- No new fields, no schema changes, no analytics changes.
- Step 4 (first screen) and step 8 (locked completion view) keep their current layout — there is nothing prior to recap on step 4, and step 8 is the final promise card.
