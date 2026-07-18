## Problem

Navigating between routes (e.g. clicking "Your Dashboard") leaves the middle content region scrolled to wherever the previous page left it, so `/challenger-dashboard` opens mid-page instead of at the top.

## Root cause (verified)

In `src/components/AppShell.tsx`, the LeadTree shell's `<main>` element is the actual scroll container (`overflow-y-auto`, height `calc(100vh - var(--topbar-h))`). The `window` never scrolls, so React Router's default behavior and any `window.scrollTo(0,0)` calls have no effect on it. Nothing currently resets `main.scrollTop` on pathname change.

## Fix

Scope: `src/components/AppShell.tsx` only.

1. Attach a `ref` to the `<main>` element in the LeadTree shell branch.
2. On every `pathname` change, reset that element's `scrollTop` to `0` inside a `useLayoutEffect` (runs before paint, so no visible jump).
3. Use `element.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior })` with a fallback to direct `scrollTop = 0` assignment.
4. Guard against hash links: if `location.hash` is present, skip the reset so in-page anchor navigation still works.

## Out of scope

- No changes to sidebars, right rail, countdown pill, or any page component.
- No changes to the fallback (non-LeadTree) shell — the window scrolls there normally.
- No new dependencies.

## Verification

- Scroll down on any page, click "Your Dashboard" → middle region lands at top.
- Repeat between Day 1 / Day 2 / Day 3 and Earn.
- Anchor links (`#section`) still jump to their target.
