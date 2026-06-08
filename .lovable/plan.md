## Problem

In `src/lib/day1StepMessages.ts`, the step labels currently read:

1. Step 1 of 9 — Audience type
2. Step 2 of 9 — Who specifically
3. Step 3 of 9 — Expert type
4. **Step 4 of 9 — Superpower**
5. **Step 4 of 9 — Challenge type**  ← duplicate
6. Step 5 of 9 — Specific problem
7. Step 6 of 9 — Your process
8. Step 7 of 9 — Outcome
9. Step 8 of 9 — Promise review  ← should be 9

Two steps are labelled "Step 4" and the final step is "Step 8" instead of "Step 9".

## Fix

Scope: `src/lib/day1StepMessages.ts` only. Update the `label` strings in `defaultDay1Steps` so each entry has a unique, sequential number from 1 to 9:

| Entry id | New label |
|---|---|
| step-1 | Step 1 of 9 — Audience type (unchanged) |
| step-2 | Step 2 of 9 — Who specifically (unchanged) |
| step-2b | Step 3 of 9 — Expert type (unchanged) |
| step-3 | Step 4 of 9 — Superpower (unchanged) |
| step-4 | **Step 5** of 9 — Challenge type |
| step-5 | **Step 6** of 9 — Specific problem |
| step-6 | **Step 7** of 9 — Your process |
| step-7 | **Step 8** of 9 — Outcome |
| step-8 | **Step 9** of 9 — Promise review |

No other files, no step content, no step order, no ids change.
