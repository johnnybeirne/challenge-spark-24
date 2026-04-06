

## Plan: Vertical Auto-Scrolling Activity Feed

### What
Transform the ActivityFeed component into a continuous vertical marquee that scrolls through all activity items as social proof. The items will scroll upward in a seamless infinite loop.

### How

**1. Update `src/components/ActivityFeed.tsx`**
- Show all 7 activity items (ignore `limit` for the scrolling variant, or add a `scrolling` prop).
- Use a CSS `@keyframes` animation for a smooth upward scroll. Duplicate the list so when the first set scrolls off-screen, the second set seamlessly continues — creating an infinite loop.
- Set a fixed visible height on the container with `overflow: hidden` to create the "window" effect (showing ~3 items at a time).
- Pause animation on hover for readability.

**2. Update `src/index.css`** (or use inline Tailwind)
- Add a `@keyframes scroll-up` animation that translates Y from `0` to `-50%` (since the list is duplicated).

### Usage
The component will be used on the Landing page and Dashboard as it already is — no changes needed to parent pages.

### Visual result
A fixed-height container showing ~3 rows at a time, with items continuously scrolling upward in a smooth loop, matching the reference screenshot's layout.

