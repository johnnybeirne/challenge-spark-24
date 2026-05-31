## Quiz question screen tweaks

All changes in `src/pages/Assessment.tsx`. No logic, scoring, or DB changes.

### 1. Rename label to "Johnny B AI"
Change the small uppercase name label above the question from `Johnny B` to `Johnny B AI`.

### 2. Typewriter animation on the question text
Reuse the same `TypewriterText` pattern already used on the redesigned results page (`src/pages/Results.tsx`):
- Add a small inline `TypewriterText` component (or a tiny local version) that reveals the string character by character on mount.
- Key it on `q.id` so it resets and replays whenever the question changes.
- Respect `prefers-reduced-motion`: show the full text immediately.
- Buttons remain visible and clickable throughout — typing animation does not block answering.

### 3. Remove the empathy subtext
Delete the muted line that currently renders beneath each question (the `EMPATHY_LINES[q.id]` paragraph), and remove the now-unused `EMPATHY_LINES` constant. The Johnny message area becomes: avatar + "Johnny B AI" label + question only.

### Out of scope
- No changes to question content, Yes/No options, scoring, progress bar, or results page.
