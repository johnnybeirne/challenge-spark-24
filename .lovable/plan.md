I understand: the left sidebar is currently implemented as two separate vertical regions — the upper content scrolls, while the bottom Settings/Tour/Support/Logout block is pinned and does not scroll with it. That matches what you’re seeing in the screenshot.

Plan:
1. Update only `src/components/leadtree/LeftSidebar.tsx`.
2. Keep the sidebar itself fixed under the top bar, but make the entire expanded menu content one single scroll container.
3. Move the bottom navigation block into the same scrollable column as Dashboard, Day Progress, and Build Momentum.
4. Remove the separate pinned-bottom wrapper behavior so Settings, Take the tour, Support, and Logout scroll consistently with the rest of the menu.
5. Preserve existing routes, icons, labels, tooltips, collapse behavior, spacing style, and scroll containment rules (`overflow-y-auto`, `overflow-x-hidden`, `overscroll-contain`, `min-h-0`).

Technical note:
- Current root cause is confirmed in `LeftSidebar.tsx`: lines 105–226 are the scrollable top region, while lines 228–257 render a separate bottom block outside that scroll area.