## Change

In `src/components/Day1Setup.tsx` (step 8 of Day 1 Setup), remove the heading block:

- "Build it with your AI co-pilot"
- "Ask anything to refine your positioning, structure, hook, or transformation. Your foundation answers are already loaded as context."

This is the `<div className="space-y-2">…</div>` wrapper at lines 535–540.

## Keep intact

- The snapshot card (challenge type, audience, problem/for/how)
- The `LearningAssistant` (prompt pills + chat)
- The "Complete Day 1 & Unlock Day 2" button and its helper text

No other files or logic change.