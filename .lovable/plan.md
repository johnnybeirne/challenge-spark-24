Widen the Day 2 content container so the recap cards (and the rest of the Day 2 step content) stretch ~90% of the viewport width on desktop, while staying readable on mobile.

## Change

**File:** `src/components/Day2Screen1.tsx` only.

Update the outer wrapper:

- From: `mx-auto max-w-2xl px-4 py-6 sm:py-8 pb-24`
- To: `mx-auto w-[90%] max-w-[1400px] px-4 py-6 sm:py-8 pb-24`

`w-[90%]` gives ~5% gutter on each side. `max-w-[1400px]` caps it on very large monitors so line lengths don't get absurd. On mobile `w-[90%]` still works comfortably alongside the existing `px-4`.

## Out of scope

- No changes to the card grid itself (still `sm:grid-cols-2`) — cards just get wider with the container.
- No changes to other Day 2 screens, the header, or any other route.
