You're right — I previously edited `ChallengeCountdown.tsx`, but the pill in your screenshot is actually rendered by `CountdownBottomBar.tsx` (the floating bottom badge that shows `Xd · Xh · Xm · Xs left`). That's why nothing visibly changed.

## Fix

In `src/components/CountdownBottomBar.tsx` (line 65–68), update the non-urgent badge classes:

- Border: thin near-black → `border-foreground/80`
- Background: slightly tinted but mostly transparent → `bg-foreground/[0.03]`
- Keep the `backdrop-blur-md` and `rounded-full` so it stays the same shape
- Leave the urgent (red) variant untouched

## Also revert the earlier mis-edit

In `src/components/ChallengeCountdown.tsx` (line 60), restore the original styling I changed by mistake:
`border-border bg-muted/40 text-muted-foreground`

That's the whole change — visual only, no logic touched.