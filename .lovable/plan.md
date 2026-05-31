## Problem

Placeholder examples use the user's full audience/topic text as the grammatical subject:

```ts
const subject = whoLower || audienceLower || "they";
"e.g. ${subject} keep hitting the same wall..."
```

When the user's answer is a sentence ("they've hit the wall again"), the placeholder reads as gibberish:
*"e.g. they've hit the wall again keep hitting the same wall and can't figure out what's actually blocking them."*

## Fix

Stop interpolating the raw answer into example sentences. Use a clean pronoun (`"they"`) as the subject inside `e.g.` hints across all three affected steps in `src/components/Day1Setup.tsx`:

1. **Step 2** (line ~1087) — `problemHintByChallenge` map
2. **Step 3** (line ~1178) — `processHintByChallenge` map and `processPlaceholder` fallback
3. **Step 9** (line ~1262) — same pattern if present (verify)

Replace `subject = whoLower || audienceLower || "they"` with a fixed `"they"` for placeholder interpolation. The echoed-back text inside Johnny's question (where the user's words read naturally with a pencil-edit affordance) is unaffected.

## Out of scope

- No changes to the AI question copy, echo rendering, or pencil editor.
- No changes to state, persistence, or scoring.
