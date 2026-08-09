# Access card heading fix

## Goal
Replace the heading block at the top of the access card in `src/components/AccessPageTemplate.tsx` with the exact single-line structure requested, and add the asterisk footnote at the bottom of the card.

## Changes
1. In `src/components/AccessPageTemplate.tsx`, replace the existing access-card heading (lines 76-84):
   - Old: `<h2>Get access for free</h2>` + `<p className="mt-2">Invite 5 people this month or upgrade for $97</p>`
   - New:
     - Line 1: `<h2>Get monthly access for free when you invite 5 people per month*</h2>` with `text-[var(--h2-size)] font-bold text-[var(--text-primary)]`
     - Line 2: `<p>or upgrade for $97/month</p>` with `text-[var(--body-size)] font-normal text-[var(--text-secondary)]` and no top margin
2. Add the asterisk note just before the closing `</section>` tag:
   - Text: "*Every person who signs up for the challenge through your link counts toward your monthly 5."
   - Styles: `text-[11px] italic text-[var(--text-muted)]`
3. Leave the progress circles, two-column options, buttons, and "See your full invite progress" link untouched.

## Files touched
- `src/components/AccessPageTemplate.tsx` only.