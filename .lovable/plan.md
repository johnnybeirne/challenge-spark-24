## Goal
On the post-signup success screen (shown after the user finishes signup via `SignupChat`), make the headline ("Your 3-day challenge is ready, {name}.") and the subcopy ("Set aside 60 minutes each day…") appear as a typed message from Johnny B AI, matching the avatar + typewriter pattern already used elsewhere in the flow.

## What changes

### `src/components/auth/SignupChat.tsx` — success-state block (lines 218–229 only)
Replace the plain `<h1>` + `<p>` with a Johnny B AI message block:

- Left: Johnny B AI avatar (`aiAvatar`) with the existing green status dot — same styling as the in-flow chat avatar (lines 239–248).
- Right:
  - Small "Johnny B AI" label (same muted style).
  - Headline `successHeadline(firstName)` typed out via a typewriter effect (reuse the existing `TypingBubble` mechanic, but render as a large bold heading, not a chat bubble — a new lightweight `TypewriterText` local component, or extend `TypingBubble` with a `variant="headline"` prop).
  - Subcopy `successSubcopy` typed out after the headline finishes (sequential reveal).
- Action buttons (Add to Calendar / Continue / Start Day 1) remain unchanged, sitting below the typed message.

Layout: centered column on mobile, avatar-left + message-right on `sm:` breakpoint, mirroring the Results page Johnny message styling so it feels consistent.

### No other changes
- No copy edits, no scoring/logic changes, no admin schema changes.
- `ChallengeSignup.tsx` and all other call sites of `SignupChat` keep working — they only pass `successHeadline` / `successSubcopy`, and the typewriter renders whatever string they return.
- Direct-signup path ("You're in, {first}. Day 1 starts now.") also gets the same Johnny B AI typed treatment automatically, since both paths share this success block.

## Files touched
- `src/components/auth/SignupChat.tsx` — success block + small internal typewriter helper