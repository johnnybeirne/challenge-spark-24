## Goal
The supporting line under the "Join the 3-Day Challenge" button on the Results page must end with a dynamic "...have this in place by [Day]." where [Day] is the user's signup/start date + 3 days. Today it's reading without the day (or showing a stale "Start now." version). We'll update the templates so the dynamic day always appears, in the exact phrasing you described.

## What changes

### 1. Update the three urgency templates in admin content (DB: `site_content` → `global / urgency`)
Restructure to lead with the tier-specific line, then close with the dynamic deadline using your wording:

- `results_low` → `Your first real win is 3 days away — don't put this off. Start now and have this in place by {day}.`
- `results_mid` → `Don't let another month pass on the same plateau. Start now and have this in place by {day}.`
- `results_high` → `Spots are limited — the next cohort starts in days, not weeks. Start now and have this in place by {day}.`

`{day}` is replaced live by the existing `useDeadline()` hook (signup/start date + 3 days, e.g. "Tuesday"). All three remain fully editable from Admin → Content under page `global`, section `urgency`.

### 2. Mirror the same defaults in `src/pages/Results.tsx`
Update the in-code `urgencyDefaults` object (lines 245–249) so the hardcoded fallback matches the new DB templates. This keeps the copy consistent even before admin overrides load.

### 3. No other changes
- The CTA button label, scoring, tier logic, archetype reveal, avatar/typing indicator, and layout are untouched.
- Other urgency surfaces (Dashboard, LockedDay, UpgradeCards, ChallengeCountdown) already use their own admin-editable templates and were addressed in the previous pass.

## Why the screenshot still shows the old line
The displayed text in your screenshot ("…Start now.") is the pre-update copy. The current preview already calls `deadline.render(template)`, but the template stored in the DB doesn't yet contain `{day}` in the position you want it. This plan rewrites those templates so the day is appended in the exact "have this in place by [Day]" form.

## Files touched
- DB migration: update 3 rows in `site_content` (page=`global`, section=`urgency`, keys=`results_low/mid/high`)
- `src/pages/Results.tsx` — update the `urgencyDefaults` fallback strings only