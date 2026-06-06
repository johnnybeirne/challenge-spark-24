# Fix: Johnny's long message disappears on Day 1 · Step 3

## What's happening
On Step 3 (Process), the intro phase uses `TypedSequence` to type out two messages: Johnny's long AI reaction to the Step 2 problem, then a short acknowledgement ("That's clear, [name]."). When typing completes, the component unmounts and the view flips to the `input` phase, which renders `JohnnyRecapPanel` instead.

`JohnnyRecapPanel` does receive `leadIn={step3Reaction}`, so in theory the long reaction should remain. In practice it disappears for one (or both) of these reasons:

1. `step3Reaction` is only snapshotted into local state once, on step entry (effect dep `[step]`). If the AI reaction arrives in the cache *after* the user is already on Step 3, the long message gets typed from the live `aiOutputs` cache (because `step3IntroMessages` is rebuilt each render), but `leadIn` reads the stale `null` snapshot — so it's blank in the input phase.
2. Even when the snapshot is populated, the typed bubble (rounded chat bubble, full text weight) is visually replaced by `leadIn` rendered as dim `text-foreground/80` with no bubble — to the user it reads as "the message vanished".

Net effect: the long, detailed message the user saw while typing disappears the moment the typing finishes.

## Fix (Day 1 Step 3 only, `src/components/Day1Setup.tsx`)

Scope: only the `step === 3` block (around lines 1750–1850) and the `step3Reaction` snapshot effect. No changes to any other step, file, or component.

1. **Make the snapshot reflect the live cache.** Update the `step3Reaction` snapshot effect to also re-sync when `state.challenge.aiOutputs.day1_problem_reaction` changes, so a late-arriving AI reaction is captured even if the user is already on Step 3.
2. **Stop replacing the typed message.** In the Step 3 render, don't swap the `TypedSequence` out for `JohnnyRecapPanel` on completion. Instead, after typing finishes, keep the same Johnny bubble(s) on screen and reveal the input controls below them.
   - Concretely: render the long reaction + short acknowledgement as persistent Johnny bubbles (using the same styling the `TypedSequence` uses). On first visit, animate them in via `TypedSequence`; once `step3Phase === "input"`, render the identical bubbles statically so the layout and visible text don't change.
   - Below the persistent bubbles, render the existing `RecapCard`, the question line, and the `RevealControls` (textarea + Continue) exactly as today.
3. **No content, copy, styling-token, or behavior changes elsewhere.** The acknowledgement text, question text, recap rows, placeholder, textarea, and Continue button remain identical.

## Result
Johnny's long reaction stays visible on Step 3 from the moment it finishes typing through to when the user clicks Continue — no flicker, no disappearance, no other changes.
