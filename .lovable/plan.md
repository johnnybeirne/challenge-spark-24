## Goal

On every Day 1 step, render the recap card above Johnny's AI message (currently it sits below). No content, styling, input, or button changes — only vertical order.

## Scope

Single file: `src/components/Day1Setup.tsx`. Nothing else touched.

## Changes per step

In each step's static phase (the one rendered after the typed intro completes), move the `RecapCard` so it appears before the Johnny message block.

**Simple swaps** — move `<RecapCard …>` above `<StaticAi …>`:

- Step 1 — lines 1433–1434
- Step 11 — lines 1488–1489
- Step 10 — lines 1574–1575
- Step 2 — lines 1680–1681
- Step 5 — lines 2039–2040 (bare variant, unchanged)

**Step 7** (lines 2200–2211): move the standalone `<RecapCard rows={recapRowsBefore(7)} …>` above the `<div className="flex items-start gap-3">…<JohnnyAvatar/>…</div>` summary block.

**Steps 3 and 9** use `JohnnyRecapPanel`, which bundles acknowledgement + recap + question inside Johnny's bubble. To put the recap above Johnny without changing the message content:

- Render `<RecapCard rows={recapRowsBefore(3)} echoMap={echoMap} />` above `<JohnnyRecapPanel …>` and pass `rows={[]}` to the panel so it no longer renders the recap internally. `RecapCard` already returns `null` when there are no visible rows, so the panel's internal call becomes a no-op. Same treatment for step 9 with `recapRowsBefore(9)`.
- This keeps the leadIn, acknowledgement, and question text inside Johnny's bubble exactly as today; only the recap moves out and up.

## Out of scope (unchanged)

- Typed intro phase (no recap rendered there today; not adding one).
- Recap content, row labels, `recapRowsBefore` logic, echo editing.
- Johnny message wording, avatar, styling, spacing classes.
- Input cards, textareas, option buttons, Continue buttons.
- Any file outside `src/components/Day1Setup.tsx`.

## Verification

Visit each Day 1 step in preview and confirm order is: recap → Johnny message → input/controls. Confirm steps 3 and 9 still show Johnny's acknowledgement and question inside the bubble (just without the embedded recap).
