## Plan

Fix the unrealistic Day 2 test view so the sidebar and day access reflect the simulated signup/start date for test user.

### What I’ll change

1. **Use elapsed challenge time for sidebar status**
  - In `ChallengeSidebar`, calculate the effective day from `challenge.startedAt`:
    - 0–24h = Day 1
    - 24–48h = Day 2
    - 48–72h = Day 3
  - Day 2 should show as **In Progress** when the simulated start date is yesterday.
  - Day 1 should show as available/complete or previous, not the only active day.
2. **Fix the countdown display**
  - The screenshot shows **“3 days left”** even while testing Day 2.
  - I’ll make the countdown floor/round realistically so a Day 2 simulation shows about **2 days left** instead of resetting to 3.
3. **Keep routes consistent**
  - Ensure Day 2 launch/navigation uses the canonical `/challenge/day/2` path so previewing Day 2 opens the actual Day 2 screen.
4. **Avoid changing unrelated challenge/business rules**
  - This will be a focused frontend/testing-state fix only.
  - No database changes.