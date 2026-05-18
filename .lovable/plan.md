## Goal
When a user starts the 3-day challenge, automatically scroll the left-hand ChallengeSidebar back to the top so the Challenge section (Day 1 / Day 2 / Day 3) is visible first.

## Why
Users may have scrolled the sidebar deep into the Learn or Tools sections. Upon starting the challenge, the newly revealed Challenge section appears above those sections, but the scroll position stays put — users can miss it and feel lost.

## Approach
1. Add a `useRef` to the scrollable `<aside>` element inside `ChallengeSidebar.tsx`.
2. Track the previous value of `hasJoinedChallenge` (from `useUserState`) using a ref.
3. In a `useEffect`, when `hasJoinedChallenge` transitions from `false` to `true`, call `asideRef.current.scrollTo({ top: 0, behavior: 'smooth' })`.

## Scope
- Single file change: `src/components/ChallengeSidebar.tsx`
- No backend, route, or state changes.
- Applies whenever the user "enters" the challenge (BlueprintBridge CTA or ChallengeSignup success).

## Edge cases handled
- Already-in-challenge users on reload: no transition, no forced scroll.
- Smooth scroll keeps it feel polished, not jarring.