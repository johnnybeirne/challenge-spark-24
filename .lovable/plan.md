# Plan: Restructure access-card headline

## Goal
Update the green "Get access for free" card in `src/components/AccessPageTemplate.tsx` so the offer hierarchy matches the user's wording.

## Current state
The card currently has:
- H2: "Get access for free"
- Subtext: "Invite 5 people this month or upgrade for $97"

## Changes
1. Replace the H2/subtext block with:
   - Primary heading: "Get access for free when you invite five people*"
   - Asterisk line directly under the heading: "*per month"
   - Secondary line below: "or upgrade for $97 per month"
2. Keep the existing two-column layout (Invite friends / Upgrade instead), progress dots, copy button, and the bottom "See your full invite progress and rewards →" link untouched.
3. Preserve all existing styling tokens and responsive behaviour.

## File touched
- `src/components/AccessPageTemplate.tsx` only.
