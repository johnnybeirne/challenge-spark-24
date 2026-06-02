// Helpers for the QA "simulated signup date" feature.
// Pure functions — no React, no Supabase.

import type { AppState } from "@/context/AppContext";
import { getChallengeEndsAt, CHALLENGE_DURATION_MS } from "@/lib/challengeWindow";
import { seedCompletedDayData } from "@/lib/qaSeedData";

export interface SimulatedTiming {
  joinedAtIso: string;
  startedAtIso: string;
  endsAtIso: string;
  currentDay: number;
  completed: boolean;
  hoursElapsed: number;
}

/**
 * Compute backdated timing from a simulated "started" date.
 * currentDay: 1 = 0–24h ago, 2 = 24–48h, 3 = 48–72h, 4 = expired.
 */
export function computeSimulatedTiming(simulatedIso: string, now: number = Date.now()): SimulatedTiming {
  const startedMs = new Date(simulatedIso).getTime();
  const safeStart = isFinite(startedMs) ? startedMs : now;
  const startedAtIso = new Date(safeStart).toISOString();
  const endsAtIso = getChallengeEndsAt(startedAtIso);
  const elapsedMs = Math.max(0, now - safeStart);
  const hoursElapsed = Math.floor(elapsedMs / (60 * 60 * 1000));
  const expired = elapsedMs >= CHALLENGE_DURATION_MS;
  const currentDay = expired ? 4 : Math.min(3, Math.floor(elapsedMs / (24 * 60 * 60 * 1000)) + 1);
  return {
    joinedAtIso: startedAtIso,
    startedAtIso,
    endsAtIso,
    currentDay,
    completed: expired,
    hoursElapsed,
  };
}

export function describeSimulatedDay(timing: SimulatedTiming): string {
  if (timing.completed) return `Challenge window expired (started ${timing.hoursElapsed}h ago)`;
  return `Simulating Day ${timing.currentDay} — started ${timing.hoursElapsed}h ago`;
}

/**
 * Returns a read-only AppState view with the user/challenge timing overridden.
 * Never mutates the input; never persists. Caller is responsible for keeping
 * the real state separate so Supabase sync doesn't write the backdated values.
 */
export function applySimulatedDate(state: AppState, simulatedIso: string | null | undefined): AppState {
  if (!simulatedIso || !state.user) return state;
  const t = computeSimulatedTiming(simulatedIso);
  const currentDay = Math.max(state.challenge.currentDay, t.currentDay);
  const completedThroughDay = t.completed ? 3 : Math.max(0, Math.min(3, currentDay - 1));
  const seeded = seedCompletedDayData(state, completedThroughDay);
  return {
    ...state,
    memory: seeded.memory,
    user: { ...state.user, joinedAt: t.joinedAtIso },
    challenge: {
      ...state.challenge,
      startedAt: t.startedAtIso,
      endsAt: t.endsAtIso,
      currentDay,
      completed: state.challenge.completed || t.completed,
      tasks: seeded.tasks,
      aiOutputs: seeded.aiOutputs,
    },
  };
}
