## Problem

The "Generate your quiz now" button is already wired to an `allRead` gate that requires cards 1, 2, and 3 to be marked as read. But it's currently unlocking too easily because of this line:

```ts
const allRead = qaUnlock || (readCards.has(0) && readCards.has(1) && readCards.has(2));
```

`qaUnlock` is true whenever:
- QA preview mode is active, OR
- A QA persona is applied, OR
- Any `leadio_preview_tier` value exists in sessionStorage

Any one of these bypasses the read-gate, so the button appears unlocked even when nothing has been marked as read.

## Fix

In `src/components/Day2Screen1.tsx`, remove the `qaUnlock` bypass from the `allRead` calculation so the Generate button is **strictly** gated on the three "Mark as read" actions:

```ts
const allRead = readCards.has(0) && readCards.has(1) && readCards.has(2);
```

Everything else stays the same:
- The locked-state button (with the Lock icon and "Mark 1, 2 & 3 as read to generate your quiz" copy) is already in place and will now show until all three cards are marked as read.
- The reveal-card unlock chain (card 2 needs card 1 read, card 3 needs card 2 read) keeps its `qaUnlock` bypass so QA can still step through the flow — only the final Generate button becomes strict.

## Question

Should QA mode also be forced to mark all three as read (strict for everyone), or is it fine to keep QA's per-card progressive unlock bypass and only make the final Generate button strict? My plan above does the latter — confirm if you want both tightened.
