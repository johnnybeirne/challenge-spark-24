# Fix: QA preview banner covers the top navigation

The QA preview bar is pinned across the very top of the screen and sits on top of the app's top navigation, hiding the logo and nav links.

## Change

Turn the full-width top bar into a small floating pill that never overlaps navigation:

- Position it bottom-left, above the countdown bar area, instead of `top-0` full width.
- Keep the same amber styling, eye icon, tier/entry label, and Exit Preview button.
- Compact: rounded pill, shadow, auto width, no layout shift on any page.
- Mobile: stays within the viewport, text truncates, Exit Preview button always tappable.

No changes to QA state logic, tier switching, or anything else.

## Technical

Single file: `src/components/QaModePanel.tsx`, the `banner` element (currently `fixed left-0 right-0 top-0 z-[90]`). Replace with a `fixed bottom-4 left-4 z-[90]` pill wrapper; inner content unchanged apart from spacing classes.
