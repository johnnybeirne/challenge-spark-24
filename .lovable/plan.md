## Goal

The current QA "Simulated Signup Date" only backdates `joinedAt` / `startedAt` and bumps `currentDay`. It does **not** simulate completion data — so clicking Day 2 lands on a locked "Day 1 still in progress" state because every `challenge.tasks[*]` is false, `aiOutputs` is empty, `points`/`network` are zeros, and `community`/`training` flags are off.

We will add **persona presets** to the QA panel that produce a believable end-to-end user state as a read-only overlay (same pattern as `applySimulatedDate` — never written to Supabase).

## Personas

Each preset answers: "What does the app look like for someone who is exactly here?"

1. **Fresh signup** — Day 1, joined 0h ago, nothing done.
2. **Mid Day 1** — joined 4h ago, ~half of Day 1 tasks checked, sample AI outputs for those.
3. **Finished Day 1** — joined 26h ago, all Day 1 tasks done, AI outputs filled, `points.completedDays:[1]`, +50 pts, Day 1 unlock awarded, `currentDay=2`.
4. **Mid Day 2** — joined 36h ago, Day 1 complete + half of Day 2 done.
5. **Finished Day 2** — joined 50h ago, Days 1–2 complete, +100 pts total, blueprint + playbook unlocks.
6. **Day 3 launched (no referrals)** — joined 60h ago, all tasks done, valid `launchUrl`, `completed=true`, 3 unlocks awarded, 0 direct referrals (Builder Circle still locked).
7. **Community unlocked** — same as #6 but `network.direct=3`, `community.unlocked=true` with timestamp/reason.
8. **Expired window** — joined 80h ago, partial progress, `endsAt` in the past.

(Final exact set can be trimmed; these are the building blocks.)

## How it works

```text
QA panel (preset dropdown)
        │
        ▼
updateQaState({ active:true, persona:"day1_done", simulatedJoinedAt:... })
        │
        ▼
AppContext: displayState = applyPersona(state, qa.persona, qa.simulatedJoinedAt)
        │
        ▼
All pages read the overlay; raw `state` is what useSupabaseSync sees → DB untouched
```

`applyPersona` extends today's `applySimulatedDate`:
- Sets `challenge.startedAt` / `endsAt` / `currentDay` / `completed` from the persona's elapsed hours (reusing `computeSimulatedTiming`).
- Marks `challenge.tasks[dayN_<key>] = true` for every task in `dayConfig` up to the persona's progress point. Generates short placeholder strings into `challenge.aiOutputs[...]` for textarea tasks so the UI renders filled answers.
- Sets `challenge.launchUrl` for personas at/past Day 3.
- Bumps `points.total`, `points.completedDays`, `points.awardedActions` to match (reusing `awardPoints` shape so `points.tier` and `unlockedRewards` derive correctly).
- Fills `network.direct` / `referrals.count` for community personas.
- Sets `community.unlocked` / `community.unlockedAt` / `entryReason` when appropriate.
- Sets `training.day1Watched` / `day2Watched` / `day3Watched` to true for completed days.
- Adds matching `unlocks[]` entries (`day1_blueprint`, `day2_playbook`, `day3_checklist`) via the same logic that lives in AppContext today (extract to a shared helper if needed).

## Files

**New**
- `src/lib/personas.ts` — `PERSONAS` array (id, label, description, elapsedHours, dayProgress, referrals, community flag) + `applyPersona(state, personaId)` pure function. Imports `dayConfig` to know task keys.

**Edit**
- `src/lib/qaPreview.ts` — add `persona?: PersonaId | null` to `QaPreviewState`, default `null`.
- `src/lib/simulatedDate.ts` — keep `applySimulatedDate` as the date-only path; have `applyPersona` call into it for the timing override so behavior stays consistent.
- `src/context/AppContext.tsx` — replace the `displayState` memo so it composes both: `qa.persona ? applyPersona(state, qa.persona) : (qa.simulatedJoinedAt ? applySimulatedDate(state, qa.simulatedJoinedAt) : state)`.
- `src/components/qa/QaSimulatedDate.tsx` (or a sibling `QaPersonas.tsx` mounted next to it in `QaModePanel`) — add a "Persona" select listing the presets, with a one-line description and a "Clear persona" button. Selecting a persona auto-fills the simulated date so the calendar reflects it.

**No DB changes. No edge function changes.**

## Guardrails

- Overlay is read-only; `useSupabaseSync` continues to receive raw `state`, so nothing leaks into Supabase even if you click around.
- Persona overlay is a strict superset of the existing date simulator — clearing the persona returns to today's behavior.
- All persona task/AI-output generation uses `dayConfig` as the source of truth, so adding/removing real tasks doesn't break the simulator.

## Out of scope

- Seeding real test rows in Supabase (we picked the overlay route).
- Simulating other users on the leaderboard / Builder Circle feed.
- Per-task granular toggles (can be added later on top of personas).
