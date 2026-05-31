## Goal
Carry the user's previous answers forward into each subsequent prompt in the Day 1 flow, so the conversation reads as one connected thread instead of independent questions.

## What's wrong today
In `src/components/Day1Setup.tsx`, the Day 1 prompts are static templates that don't reference the user's prior input:

- Step 6 (description): user types `"new parents in their 30s"` → clicks Continue.
- Step 2 (problem): prompt is just `"Now tell me about the problem or obstacle they're trying to overcome."` — no mention of "new parents in their 30s".
- Step 3 (process): `"Now describe your process — how you take them through it and create the result."` — no mention of who or what problem.
- Step 9 (outcome): `"Finally, describe the result they'll experience by the end of your challenge."` — no callback either.

Order in code: step 4 (B2B/B2C) → step 5 (result type cards) → step 6 (who: topicHint) → step 2 (problem) → step 3 (process) → step 9 (outcome) → step 7 (summary).

## Change
Rewrite the intro line for steps 2, 3, and 9 so Johnny AI quotes back the most relevant prior answer(s). Keep a graceful fallback when a value is empty.

### Step 2 — Problem
Replace the single `step2Messages` line with a dynamic line that names the audience.

- If `topicHint` is filled: `Got it — ${topicHint}. What problem or obstacle are they trying to overcome?`
- Fallback: existing line.

Example: `Got it — new parents in their 30s. What problem or obstacle are they trying to overcome?`

### Step 3 — Process
Reference both who and the problem so the thread keeps building.

- If `topicHint` and `problem` are both filled: `That's clear. So for ${shortWho(topicHint)} dealing with ${shortPain(problem)} — how do you take them through it to create the result?`
- If only `topicHint`: `That's clear. So for ${shortWho(topicHint)} — how do you take them through it to create the result?`
- Fallback: existing line.

`shortWho` / `shortPain` are small inline helpers that trim trailing punctuation and lowercase the pain string, matching the pattern already used in step 7's `strip()` helper.

### Step 9 — Outcome
Tie the outcome back to the audience and the chosen challenge type.

- If `topicHint` and `challengeType` are filled: `Last one${fn}. By the end of this challenge, what result will ${shortWho(topicHint)} walk away with?`
- Fallback: existing line.

### Step 7 — Summary
Already references `who / pain / result / methodPhrase` — no change needed.

## Technical notes
- All edits are inside `src/components/Day1Setup.tsx`, in the `step === 2`, `step === 3`, and `step === 9` IIFE blocks, only touching the `stepNMessages` array and adding 1–2 small local helpers.
- `topicHint`, `problem`, `audienceType`, `challengeType`, and `fn` are already in scope.
- `TypedSequence` already takes a `resetKey`; bump the keys for steps 2/3/9 to include the upstream value (e.g. `step2-intro-${topicHint.length}`) so the typed line re-renders if the user goes back and edits.
- No business logic, no state shape changes, no new dependencies — purely the wording of the prompts.

## Out of scope
- No changes to the cards, layout, or styling.
- No changes to step 7's summary copy or the Challenge Promise.
- No changes to placeholders inside the textareas (those already vary by audience+challenge type).