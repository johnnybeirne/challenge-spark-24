## Make QA Mode Panel Draggable

### Goal
Convert the fixed-position QA Mode popup into a freely draggable floating window that can be moved anywhere on screen and stays out of the way of the content being tested.

### What will change

**`src/components/QaModePanel.tsx`**

1. **Add drag state** — track `x`, `y` position (default near bottom-left, where it currently sits).
2. **Add drag handlers** — mousedown on the panel header starts drag; window mousemove updates position; mouseup ends drag. Same for touch events.
3. **Make the header a drag handle** — cursor changes to `grab`/`grabbing`, only the sticky header initiates drag so buttons inside the panel body still work.
4. **Replace fixed positioning** — remove `fixed bottom-16 left-4`, use `fixed` with dynamic `left`/`top` via inline `transform: translate(x, y)`.
5. **Persist position** — save last position to `localStorage` under `leadio_qa_panel_pos` so it reopens in the same spot across toggles and page reloads.
6. **Constrain to viewport** — clamp position so the panel can never be dragged completely off-screen.

### No other files touched.