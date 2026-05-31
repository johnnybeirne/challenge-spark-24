## Problem
At step 6 of the Day 1 challenge setup (`src/components/Day1Setup.tsx`), the AI prompt currently says:

> "You're helping [businesses/people] [challenge type] — tell me about them in detail."

The user wants the copy adjusted based on which challenge type was selected:

- **"Overcome a specific blocker"** → "You're helping businesses overcome a specific blocker — tell me more about these specific blockers."
- **"Deliver a meaningful result fast"** → "You're helping [businesses/people] deliver a meaningful result fast — tell me more about this."
- **"Build something they keep using"** → "You're helping [businesses/people] build something they keep using — tell me more about this."
- **"Progress toward an important goal"** → "You're helping [businesses/people] progress toward an important goal — tell me more about this."

## Change
Update the `step6Messages` array in `src/components/Day1Setup.tsx` (around line 1154–1157) to branch on `challengeType`, using the phrasing above.