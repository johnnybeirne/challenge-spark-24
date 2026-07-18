Audit result
-----------
The only Day Progress timeline in the app is in `src/components/leadtree/LeftSidebar.tsx` (lines 83-131). It already renders each day row as a single inline label:

```tsx
<span className="block text-sm leading-tight">
  Day {d} <span className="text-[#6B7280]">- {dayDate(d)}</span>
</span>
<span className="mt-0.5 block text-[11px] font-normal">
  {isDone ? "Completed" : isCurrent ? "In Progress" : "Locked"}
</span>
```

- Day label and date read as one line: "Day 1 - Sat 18 Jul".
- The separate right-hand date column has already been removed.
- Status line (Completed / In Progress / Locked) remains below the combined label.
- Dates are still dynamic, driven by the same `dayDate(d)` helper based on `state.challenge.startedAt`.
- Icons, colours, and spacing are unchanged.

Plan
----
1. Confirm the running preview reflects the current code (the layout should already show the hyphenated day-date line).
2. If the preview is stale, trigger a rebuild/refresh so the latest `LeftSidebar.tsx` is rendered.
3. No file edits are required for this request.

Files reviewed
--------------
- `src/components/leadtree/LeftSidebar.tsx`