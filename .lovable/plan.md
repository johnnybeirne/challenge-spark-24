## Diagnosis

The changes are present in the code and are visible only after entering the admin preview flow at `/let-me-in`, which sets the `leadio_view_as_user` session flag and redirects to `/challenger-dashboard`.

When refreshing `/challenger-dashboard` directly as the current preview user, the visible page is still the older LMS-style fallback:

```text
LEFT: old profile/start/day cards
TOP: only logout / no tool navbar
CENTER: watch-first video dominates
RIGHT: absent
```

After opening `/let-me-in`, the intended shell appears:

```text
LEFT: LEADIO journey sidebar
TOP: Training / Community / Events / AI Coach / Leaderboard
CENTER: Today: Define Your Challenge + current task
RIGHT: Top Challengers / Momentum / Invite Progress / Next Unlock
```

So the problem is not cache or missing CSS. The current direct refresh path is not reliably satisfying the Challenger shell gate.

## Root cause

`useIsChallengerShell()` currently returns true for:

- `role === "challenger"`
- `role === "admin"` on challenger-owned routes
- the `/let-me-in` session flag

But in the normal preview/refresh state, the user being rendered appears as a challenge participant/free student state rather than canonical `role === "challenger"`, and the admin preview flag is not set unless `/let-me-in` is visited. That means `/challenger-dashboard` falls back to the older Dashboard/ChallengeSidebar layout.

## Plan

1. **Tighten the canonical shell gate**
   - Update `src/hooks/useIsChallengerShell.ts` so `/challenger-dashboard` and challenge-owned routes render the Challenger shell for any authenticated user who has entered/started the challenge, not only `role === "challenger"` or admin preview.
   - Keep partner routes excluded so partner navigation is not broken.

2. **Make AppShell use that gate as the layout source of truth**
   - In `src/components/AppShell.tsx`, change `showChallengeSidebar` from the broader `showNav && authenticated && experience !== "partner"` behavior to a clearer split:
     - Challenger shell: left sidebar + top navbar + right rail + challenger bottom nav.
     - Non-challenger authenticated shell: existing ConsumerNav or PromoterNav.
   - This prevents the old sidebar from mounting when the Challenger shell should be active.

3. **Ensure the left sidebar cannot fall back to the old LMS/profile layout on `/challenger-dashboard`**
   - In `src/components/ChallengeSidebar.tsx`, use the same `isChallengerShell` gate consistently.
   - Remove or bypass the older profile/start/video-style sidebar path for challenger-owned routes, without deleting functionality used by non-challenger pages.

4. **Keep Dashboard focused on current challenge action**
   - In `src/pages/Dashboard.tsx`, ensure `/challenger-dashboard` uses the Challenger-focused dashboard whenever the canonical shell gate is true.
   - Do not alter challenge progression, referrals, unlocks, analytics, AI Coach, events, training, community, profile, notifications, or existing routes.

5. **Validate visibly**
   - Check `/challenger-dashboard` directly after refresh.
   - Check `/let-me-in` still works.
   - Confirm the visible architecture is:

```text
LEFT SIDEBAR    = journey + progression + location
TOP NAVBAR      = ecosystem utilities/tools
CENTER CONTENT  = current challenge action
RIGHT SIDEBAR   = momentum/social proof/rewards
```
