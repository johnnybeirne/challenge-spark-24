// QA persona presets — read-only overlays on top of AppState.
// Never persisted. Used by QA panel to preview the app from the
// perspective of users at different points in the 3-day journey.

import type { AppState, UnlockEntry } from "@/context/AppContext";
import { computeSimulatedTiming } from "@/lib/simulatedDate";
import { getPointTier, getUnlockedRewards } from "@/lib/points";

export type PersonaId =
  | "fresh"
  | "mid_day_1"
  | "done_day_1"
  | "mid_day_2"
  | "done_day_2"
  | "launched_no_referrals"
  | "community_unlocked"
  | "expired";

export interface PersonaDefinition {
  id: PersonaId;
  label: string;
  description: string;
  /** Hours since they "joined" the challenge. Drives startedAt/endsAt/currentDay. */
  elapsedHours: number;
  /** Day progress per day: 0 = none, 0.5 = half tasks, 1 = all tasks done + day awarded. */
  dayProgress: { 1: number; 2: number; 3: number };
  /** Direct referrals (drives Builder Circle eligibility). */
  directReferrals: number;
  /** Force community unlocked even if referrals < 3 (admin-style preview). */
  communityUnlocked?: boolean;
  /** Fill challenge.launchUrl. */
  launched?: boolean;
}

export const PERSONAS: PersonaDefinition[] = [
  {
    id: "fresh",
    label: "Fresh signup",
    description: "Just joined. Day 1 unlocked, nothing done yet.",
    elapsedHours: 0,
    dayProgress: { 1: 0, 2: 0, 3: 0 },
    directReferrals: 0,
  },
  {
    id: "mid_day_1",
    label: "Mid Day 1",
    description: "~4h in, half of Day 1 tasks done.",
    elapsedHours: 4,
    dayProgress: { 1: 0.5, 2: 0, 3: 0 },
    directReferrals: 0,
  },
  {
    id: "done_day_1",
    label: "Finished Day 1",
    description: "Day 1 complete, Day 2 unlocked.",
    elapsedHours: 26,
    dayProgress: { 1: 1, 2: 0, 3: 0 },
    directReferrals: 0,
  },
  {
    id: "mid_day_2",
    label: "Mid Day 2",
    description: "Day 1 done, partway through Day 2.",
    elapsedHours: 36,
    dayProgress: { 1: 1, 2: 0.5, 3: 0 },
    directReferrals: 1,
  },
  {
    id: "done_day_2",
    label: "Finished Day 2",
    description: "Days 1–2 complete, Day 3 unlocked.",
    elapsedHours: 50,
    dayProgress: { 1: 1, 2: 1, 3: 0 },
    directReferrals: 1,
  },
  {
    id: "launched_no_referrals",
    label: "Day 3 launched (0 referrals)",
    description: "All tasks done, URL submitted. Builder Circle still locked.",
    elapsedHours: 60,
    dayProgress: { 1: 1, 2: 1, 3: 1 },
    directReferrals: 0,
    launched: true,
  },
  {
    id: "community_unlocked",
    label: "Community unlocked",
    description: "Launched + 3 direct referrals. Builder Circle access.",
    elapsedHours: 64,
    dayProgress: { 1: 1, 2: 1, 3: 1 },
    directReferrals: 3,
    launched: true,
    communityUnlocked: true,
  },
  {
    id: "expired",
    label: "Expired window",
    description: "80h ago, only Day 1 done. Window closed.",
    elapsedHours: 80,
    dayProgress: { 1: 1, 2: 0, 3: 0 },
    directReferrals: 0,
  },
];

export const getPersona = (id: PersonaId | null | undefined): PersonaDefinition | null =>
  PERSONAS.find((p) => p.id === id) ?? null;

// Task keys are the source of truth from src/pages/DayChallenge.tsx dayConfig.
// Kept in sync manually — if you add/remove a task there, update here too.
const DAY_TASKS: Record<1 | 2 | 3, { key: string; isTextarea: boolean; sample?: string }[]> = {
  1: [
    { key: "define_app", isTextarea: true, sample: "Coaches and consultants who want more qualified leads without burning out on content." },
    { key: "problem", isTextarea: true, sample: "Their growth depends on constant outreach and posting — it’s not leveraged." },
    { key: "result", isTextarea: true, sample: "A simple lead system that runs even when they’re not creating content." },
    { key: "share_reason", isTextarea: true, sample: "It helps friends quickly see what’s missing in their own lead generation." },
  ],
  2: [
    { key: "quiz_questions", isTextarea: true, sample: "1. Do you have a clear ideal client?\n2. Do you know your top lead source?\n3. Do you have a repeatable follow-up?\n4. Do you track conversion rates?\n5. Do you have a referral system?" },
  ],
  3: [
    { key: "landing_page", isTextarea: false },
    { key: "lead_magnet_quiz", isTextarea: false },
    { key: "result_page", isTextarea: false },
    { key: "day_content", isTextarea: false },
    { key: "invite_step", isTextarea: false },
  ],
};

const DAY_UNLOCKS: Record<1 | 2 | 3, { id: string; name: string; value: number; reason: string }> = {
  1: { id: "day1_blueprint", name: "App blueprint", value: 97, reason: "Completed Day 1" },
  2: { id: "day2_playbook", name: "Challenge playbook", value: 147, reason: "Completed Day 2" },
  3: { id: "day3_checklist", name: "Launch checklist", value: 97, reason: "Completed Day 3" },
};

const SAMPLE_LAUNCH_URL = "https://example.com/your-challenge";

/** Apply persona overlay. Pure — never mutates input or persists. */
export function applyPersona(state: AppState, personaId: PersonaId): AppState {
  const persona = getPersona(personaId);
  if (!persona || !state.user) return state;

  // 1. Timing — backdate joined / startedAt / currentDay / completed / endsAt.
  const startedIso = new Date(Date.now() - persona.elapsedHours * 60 * 60 * 1000).toISOString();
  const timing = computeSimulatedTiming(startedIso);

  // 2. Tasks + AI outputs.
  const tasks: Record<string, boolean> = { ...state.challenge.tasks };
  const aiOutputs: Record<string, string> = { ...state.challenge.aiOutputs };
  ([1, 2, 3] as const).forEach((day) => {
    const progress = persona.dayProgress[day];
    if (progress <= 0) return;
    const dayTasks = DAY_TASKS[day];
    const count = progress >= 1 ? dayTasks.length : Math.max(1, Math.floor(dayTasks.length * progress));
    dayTasks.slice(0, count).forEach((t) => {
      tasks[`day${day}_${t.key}`] = true;
      if (t.isTextarea && t.sample) aiOutputs[`day${day}_${t.key}`] = t.sample;
    });
  });

  // 3. Points + unlocks per fully-completed day.
  const completedDays: number[] = [];
  const awardedActions: string[] = [...state.points.awardedActions];
  const activity = [...state.points.activity];
  const unlocks: UnlockEntry[] = [...state.unlocks];
  let total = state.points.total;
  ([1, 2, 3] as const).forEach((day) => {
    if (persona.dayProgress[day] < 1) return;
    completedDays.push(day);
    const actionId = `complete_day_${day}`;
    if (!awardedActions.includes(actionId)) {
      awardedActions.push(actionId);
      total += 50;
      activity.push({
        id: `${actionId}-${day}`,
        label: `You earned 50 points for completing Day ${day}`,
        points: 50,
        timestamp: new Date(Date.now() - (persona.elapsedHours - day * 12) * 60 * 60 * 1000).toISOString(),
      });
    }
    const u = DAY_UNLOCKS[day];
    if (!unlocks.find((e) => e.id === u.id)) {
      unlocks.push({ ...u, timestamp: new Date().toISOString() });
    }
  });

  const tier = getPointTier(total).name;
  const unlockedRewards = getUnlockedRewards(total).map((r) => r.title);

  // 4. Launch URL + completion.
  const launchUrl = persona.launched ? SAMPLE_LAUNCH_URL : state.challenge.launchUrl;
  const completed = persona.dayProgress[3] >= 1 || timing.completed;

  // 5. Training watched flags follow day completion.
  const training = {
    ...state.training,
    day1Watched: state.training.day1Watched || persona.dayProgress[1] > 0,
    day2Watched: state.training.day2Watched || persona.dayProgress[2] > 0,
    day3Watched: state.training.day3Watched || persona.dayProgress[3] > 0,
  };

  // 6. Network + community.
  const network = { ...state.network, direct: Math.max(state.network.direct, persona.directReferrals) };
  const referrals = {
    ...state.referrals,
    count: Math.max(state.referrals.count, persona.directReferrals),
  };
  const communityShouldUnlock =
    persona.communityUnlocked || (persona.launched && persona.directReferrals >= 3 && completed);
  const community = communityShouldUnlock
    ? {
        ...state.community,
        unlocked: true,
        unlockedAt: state.community.unlockedAt ?? new Date().toISOString(),
        entryReason: state.community.entryReason ?? "invited_3",
      }
    : state.community;

  // currentDay: highest day reachable by timing OR by progress.
  const progressDay = persona.dayProgress[3] >= 1 ? 3 : persona.dayProgress[2] >= 1 ? 3 : persona.dayProgress[1] >= 1 ? 2 : 1;
  const currentDay = Math.min(3, Math.max(state.challenge.currentDay, timing.currentDay, progressDay));

  return {
    ...state,
    user: { ...state.user, joinedAt: timing.joinedAtIso },
    challenge: {
      ...state.challenge,
      startedAt: timing.startedAtIso,
      endsAt: timing.endsAtIso,
      currentDay,
      completed,
      tasks,
      aiOutputs,
      launchUrl,
    },
    points: {
      ...state.points,
      total,
      tier,
      completedDays: Array.from(new Set([...state.points.completedDays, ...completedDays])).sort(),
      awardedActions,
      activity,
      unlockedRewards,
    },
    unlocks,
    network,
    referrals,
    community,
    training,
  };
}
