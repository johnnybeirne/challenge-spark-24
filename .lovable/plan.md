## Goal
Make `/earn` (src/pages/EarnRewards.tsx) visually match `/challenge/day-1`'s page shell and header treatment. Content, sections, and logic stay unchanged.

## Scope
Only edit `src/pages/EarnRewards.tsx`. No other files touched. No changes to invite logic, referral fetches, points, ladder, partner bonuses, or leaderboard.

## Changes

1. Container width & padding
   - Replace the outer `<div className="mx-auto max-w-2xl px-5 py-8 pb-24 lg:py-10">` with Day 1's `app-page-container py-6 pb-24 lg:py-8` wrapper so the page uses the same width and vertical rhythm as Day 1.

2. Eyebrow style
   - Replace the current muted eyebrow (`text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground`) with Day 1's StepHeader eyebrow: `text-[11px] font-black uppercase tracking-[0.18em] text-primary`.
   - Text stays "Earn Rewards" (no day/step numbering since this isn't a challenge day).

3. Heading typography
   - Add a header block above section 1 using Day 1 StepHeader classes:
     - h1: `text-2xl sm:text-3xl font-black leading-tight text-foreground` — "Invite Friends, {firstName}" / "Invite Friends".
     - Subheading: `mt-3 text-base sm:text-lg font-semibold text-foreground` — the current invite intro line.
   - This h1 replaces the h1 currently inside the gradient card.

4. Remove gradient hero card
   - Drop the `rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-7 shadow-sm` wrapper.
   - Keep every child element (referral link display, Share/Copy buttons, WhatsApp/Email row) in the same order, rendered directly on the page background like Day 1 content.
   - The "The fastest way to unlock rewards…" helper line stays.

## Out of scope
- No changes to sections 2–5 (Progress, Ladder, Partner Bonuses, Leaderboard) beyond inheriting the new container width.
- No copy edits, no color-token changes, no button variant changes.
- No route or navigation changes.
