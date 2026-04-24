Plan to fix View as User bypassing training

1. Make the demo user start at the correct first-user screen
- Update the Owner Console “View as User” route so it clears the demo setup flag and sends the simulated user to `/day/1`, not directly to `/dashboard`.
- This ensures the pre-challenge training screen appears first: “How this challenge works”.

2. Prevent stale setup state from surviving in the same render
- Keep removing `leadio_setup` from localStorage when entering View as User.
- Add a small demo-specific reset signal if needed so `DayChallenge` cannot initialize from an old `getSetup()` value.
- The goal is that every new View as User session behaves like a brand-new participant.

3. Keep the dashboard behavior clean
- If the simulated user later reaches the dashboard before setup is complete, the dashboard should still show the setup/training prompt, not completed Day 1 content.
- The “Start setup” button will continue to route to `/day/1`, where training appears.

4. Preserve the admin escape route
- Keep the existing “Exit user view” behavior so the owner can leave the simulated experience and return safely.

Technical details
- Primary files to update:
  - `src/pages/AdminViewAsUser.tsx`
  - `src/pages/DayChallenge.tsx` only if a stronger reset is needed
  - `src/pages/Dashboard.tsx` only if the dashboard needs an additional guard
- No backend or database changes are needed.
- This is a frontend state/routing fix around the demo session and onboarding setup flag.