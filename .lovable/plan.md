
## Goal

Adopt the standard app-shell scroll model (Slack / Linear / Notion / Gmail) so the recurring scroll bugs stop being one-off patches and start being governed by one rule.

## The rule

The page itself never scrolls. The shell is locked to the viewport height. Inside the shell there are exactly three independent scroll regions:

- Left sidebar — scrolls on its own when its content is taller than the viewport
- Main content — the primary scroll region, where the participant reads
- Right sidebar — scrolls on its own when its content is taller than the viewport

Top bar and countdown pill are fixed chrome and never scroll.

## Current state (confirmed)

- `src/components/AppShell.tsx` uses `min-h-screen` on the root and a single `<main>` that grows with content, so scrolling happens on the page, not on the middle column.
- `LeftSidebar` and `RightSidebar` are `fixed` between `top-[72px]` and `bottom-0` with `overflow-y-auto` inside, so they already have their own scroll containers — but because the page also scrolls, the browser gets two competing scrollbars and scroll leaks between them (this is what "confused" feels like).
- The countdown pill is `fixed bottom-4`, which is correct chrome behaviour and stays as-is.

The fix is entirely in `AppShell.tsx` and a matching tweak to how the sidebars anchor. No behaviour, routing, or content changes.

## Changes

1. Shell root
   - Root wrapper becomes `h-screen overflow-hidden` (not `min-h-screen`).
   - Top bar stays fixed at the top.

2. Middle column
   - `<main>` becomes the only vertical scroller for content: `h-[calc(100vh-72px)] overflow-y-auto` with the existing sidebar-aware left/right padding kept.
   - Bottom padding stays large enough to clear the countdown pill.
   - The inner max-width wrapper stays exactly as it is.

3. Sidebars
   - Keep them `fixed` from `top-[72px] bottom-0` with `overflow-y-auto` on their inner content. This is already correct — no visual change, just verified against the new rule.

4. Countdown pill
   - Stays `fixed bottom-4` — it is chrome, not content.

5. Public / partner fallback shell
   - Not touched. That branch is landing-page style and the whole page scrolling is correct there.

6. Mobile
   - Below `lg`, sidebars are hidden and the bottom `ConsumerNav` is shown. On mobile the middle column still owns the scroll (`h-[calc(100vh-72px)] overflow-y-auto`), with bottom padding to clear the mobile nav.

## What this fixes

- Middle content stops fighting the page scroller — one scrollbar, in the middle, where the reader expects it.
- Left and right sidebars scroll independently without dragging the main content.
- Countdown pill and top bar stay put no matter what.
- Focus mode and collapse animations keep working — they only change padding on the middle column, which is still the sole content scroller.

## Out of scope

- No changes to sidebar contents, timer, tooltips, routing, or any page.
- No changes to the public/partner fallback shell.
- No new dependencies.

## Files touched

- `src/components/AppShell.tsx` — root height/overflow, `<main>` height/overflow, verify padding.

## Verification

- Load `/challenger-dashboard`, `/challenge/day-1`, `/earn`: middle scrolls, sidebars do not move.
- Collapse each sidebar, toggle Focus Mode: middle column resizes smoothly, still the only content scroller.
- Long left sidebar content (Day list + Momentum + footer): left column scrolls internally without affecting middle.
- Mobile viewport: single scroller in the middle, bottom nav stays fixed, no double scrollbars.
