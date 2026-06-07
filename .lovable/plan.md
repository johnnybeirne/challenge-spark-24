# Plan: New animated journey on /jv-partners

Scope: only `src/pages/JvPartners.tsx`. No other files touched.

## What changes

Replace the existing "How it works — animated vertical flowchart" `<section>` (the one rendering `HOW_IT_WORKS`) with a new 7-step animated vertical journey. Keep all other sections (hero, offer, leaderboard mockup, network effect, benefits, CTA) untouched.

## Step data (exact copy)

Replace the `HOW_IT_WORKS` constant with a new `JOURNEY` array of 7 items, each with `kind: "journey" | "reward" | "outcome"`, `title`, `desc`, and an optional `badge`.

1. journey — "Every time you promote, more new people promote you" — "Every person you send in is rewarded for inviting new people. The new people they invite are rewarded for inviting new people. Your audience constantly grows."
2. journey — "They take the quiz" — "Each person gets a personalised diagnosis — Pioneer, Architect, or Authority. They feel understood before they even sign up."
3. journey — "They join the challenge" — "Motivated by their result they sign up and start building their own challenge in 3 days."
4. reward — "You appear on the leaderboard" — "Every signup you send lifts you on the Top Referrers board — visible to every single participant inside the challenge." Badge: "Your reward"
5. journey — "They invite new people" — "Every participant is rewarded for inviting new people. The people you sent in now send new people in — and your name stays at the origin of that growth."
6. reward — "Your offer is featured as a reward" — "Your product or service sits on the rewards ladder as a double unlock — earned by participants, not served as an ad." Badge: "Your reward"
7. outcome — "Your reach compounds" — "The more you promote, the more people you have promoting you to new people. One promotion starts it. Every promotion grows it."

## Visual styling (semantic tokens)

- Journey steps: purple numbered circle (`bg-primary text-primary-foreground`) showing the step number, neutral card border.
- Reward steps: amber pulsing border (`border-amber-500/60 animate-pulse` ring, amber-tinted icon circle with `Gift` icon, no step number). Render the "Your reward" `Badge` (amber variant via classes) in the card header.
- Outcome step: green (`border-emerald-500/60`, emerald icon circle) with `Infinity` icon from lucide-react.
- Connecting line between steps: a thin vertical `bg-border` segment that animates its height from 0 → full when the step above enters view. Color matches the next step's accent (purple → amber → purple → amber → emerald).

## Animation

- Per-step `IntersectionObserver` (reuse existing `useInView` hook, one instance per step via a small `JourneyStep` subcomponent) so each step fades+translates up independently as the user scrolls to it (`opacity 0 → 1`, `translateY 16px → 0`, ~500ms ease-out).
- Connecting line below each step uses its own observer and animates `scaleY 0 → 1` from the top, ~400ms.
- Reward cards add `animate-pulse` on the border ring; outcome card keeps a static emerald border.

## Layout

- `flex flex-col items-center`, cards `w-full max-w-md`, content stacks vertically.
- Mobile friendly: single column at all breakpoints, padding `p-5`, icon/number circle `h-11 w-11` shrink-0, text wraps. No horizontal scroll.

## Imports to add

`Infinity` and `Gift` (Gift already imported) from lucide-react. Remove now-unused icons (`Megaphone`, `Repeat`, `ArrowDown`) only if they are no longer referenced after the replacement; keep everything else.

## Out of scope

- No edits to leaderboard, hero, CTA, benefits, network-effect, or any other file.
- No new routes, no admin, no data wiring.
