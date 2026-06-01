## Problem

On Day 1 (steps 3 and 9), the recap panel shows `Your avatar is: hit a wall`. The `topicHint` field is no longer the avatar — step 6 repurposed it to capture the answer to *"What's happening for them right now that makes your three-day challenge the perfect solution?"*. The label was never updated, so the trigger-moment answer is being displayed under the wrong label.

## Change

In `src/components/Day1Setup.tsx`, update the two recap rows that read from the `topic` echo field:

- Line 1396 (step 3 `step3RecapRows`)
- Line 1499 (step 9 `step9RecapRows`)

Replace:
```ts
label: subjectField === "topic" ? "Your avatar is:" : audienceLabel(...)
```
with:
```ts
label: subjectField === "topic" ? "Your challenge will help them with:" : audienceLabel(...)
```

The echoed value (`topicHint`) stays the same — only the label changes. No other steps, logic, or fields are touched.

## Out of scope

- The "edit" inline editor for that row keeps editing the same field (correct behavior).
- No changes to step 6 itself, scoring, memory, or AI prompts.
