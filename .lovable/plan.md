## Goal

When a user has joined the 3-Day Challenge, show Day 1, Day 2, and Day 3 nav items in the sidebar — placed **above** the "Learn" section.

## Current behavior

In `src/components/ChallengeSidebar.tsx`, when `midChallenge` is true (joined + not completed), the Learn section collapses to a single "Training" button linking to `/blueprint/dashboard`. There are no direct links to Day 1/2/3 (`/day/1`, `/day/2`, `/day/3`).

## Change

Add a new sidebar section above the existing Learn block, rendered only when `hasJoinedChallenge` is true:

- Section label: "Challenge"
- Three items: Day 1, Day 2, Day 3 → routes `/day/1`, `/day/2`, `/day/3`
- Each item shows day number, short label (e.g. "Foundations" / "Build" / "Launch" — pulled from existing day metadata if present, otherwise generic), and a state badge:
  - **Locked** (lock icon, muted) if `state.challenge.currentDay < n`
  - **Active** (ring + primary) if currently on that route or `currentDay === n`
  - **Complete** (check icon) if `aiOutputs[day${n}_completed_at]` or equivalent completion flag is set
- Collapsed sidebar variant: show just the number badge with state styling, matching existing module items
- Active route gets `ring-2 ring-primary/20` like other nav items

The Learn section keeps its current behavior (single "Training" button while mid-challenge).

## Files

- `src/components/ChallengeSidebar.tsx` — add the new Challenge section before the Learn IIFE block; reuse existing styling tokens and `go()` helper.

## Out of scope

- No changes to `/day/:day` page itself
- No changes to unlock logic or `useUserState`
- No changes to bottom nav
