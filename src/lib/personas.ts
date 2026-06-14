// QA persona presets — read-only overlays on top of AppState.
// Never persisted. Used by QA panel to preview the app from the
// perspective of users at different points in the 3-day journey.

import type { AppState, UnlockEntry } from "@/context/AppContext";
import type { MemoryChallengeType } from "@/lib/personalisation";
import { computeSimulatedTiming } from "@/lib/simulatedDate";
import { getPointTier, getUnlockedRewards } from "@/lib/points";
import { seedCompletedDayData } from "@/lib/qaSeedData";
import { generateResult } from "@/lib/assessmentData";

const SAMPLE_ASSESSMENT_ANSWERS: Record<string, string> = {
  q1: "yes", q2: "yes", q3: "no", q4: "yes", q5: "no",
  q6: "yes", q7: "yes", q8: "no", q9: "yes",
};

export type PersonaId =
  | "fresh"
  | "mid_day_1"
  | "done_day_1"
  | "mid_day_2"
  | "done_day_2"
  | "launched_no_referrals"
  | "community_unlocked"
  | "expired"
  | "marcus_b2b"
  | "sophie_b2c";

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
  /** Override stub user fields (name/email shown across the app). */
  userOverrides?: Partial<{ name: string; firstName: string; lastName: string; email: string; inviteCode: string }>;
  /** Override memory fields (drives challenge identity, audience type, etc). */
  memoryOverrides?: Partial<{
    name: string;
    audienceType: "b2b" | "b2c";
    challengeType: MemoryChallengeType;
    topic: string;
    desiredOutcome: string;
    challengeName: string;
    challengeTitleOverride: string;
  }>;
  /** Pre-fill aiOutputs keys (e.g. day1_define_app). Applied after seeding. */
  aiOutputOverrides?: Record<string, string>;
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
  {
    id: "marcus_b2b",
    label: "Marcus — B2B consultant (fresh)",
    description: "B2B fundraising consultant. Day 1 fresh start with pre-filled content.",
    elapsedHours: 0,
    dayProgress: { 1: 0, 2: 0, 3: 0 },
    directReferrals: 0,
    userOverrides: {
      name: "Marcus Chen",
      email: "marcus@nextlevelfundraising.com",
      inviteCode: "MARCUS",
    },
    memoryOverrides: {
      name: "Marcus Chen",
      audienceType: "b2b",
      challengeType: "transformation",
      topic: "Next Level",
      desiredOutcome: "A predictable pipeline of qualified donor meetings without cold outreach burnout.",
      challengeName: "The Next Level Challenge",
      challengeTitleOverride: "The Next Level Challenge",
    },
    aiOutputOverrides: {
      day1_define_app: "Nonprofit development directors at $5M–$25M orgs who need to grow major gifts but are stuck doing everything themselves.",
      day1_problem: "They rely on one-off events and personal hustle. There's no repeatable system to identify, qualify, and move donors up the giving ladder.",
      day1_result: "A 90-day pipeline framework that consistently surfaces 10+ qualified major donor conversations a month — without cold outreach.",
      day1_share_reason: "Most development directors I talk to know they need this but can't see what's broken. This challenge shows them in 3 days.",
    },
  },
  {
    id: "sophie_b2c",
    label: "Sophie — B2C coach (fresh)",
    description: "B2C midlife reinvention coach. Day 1 fresh start with pre-filled content.",
    elapsedHours: 0,
    dayProgress: { 1: 0, 2: 0, 3: 0 },
    directReferrals: 0,
    userOverrides: {
      name: "Sophie Laurent",
      email: "sophie@nextchaptercoaching.com",
      inviteCode: "SOPHIE",
    },
    memoryOverrides: {
      name: "Sophie Laurent",
      audienceType: "b2c",
      challengeType: "transformation",
      topic: "Next Chapter",
      desiredOutcome: "A clear, confident plan for the next chapter of life — career, identity, and purpose.",
      challengeName: "The Next Chapter Challenge",
      challengeTitleOverride: "The Next Chapter Challenge",
    },
    aiOutputOverrides: {
      day1_define_app: "Women 45–60 navigating a midlife pivot — empty nest, career shift, or identity reset — who want clarity on what's next.",
      day1_problem: "They feel stuck between who they were and who they're becoming. Generic life-coaching advice doesn't speak to this specific transition.",
      day1_result: "A personal Next Chapter map: their values, energy patterns, and a 12-week experiment to test their next direction.",
      day1_share_reason: "Every woman I know in this phase is quietly searching. This gives them language and a first step in 3 days.",
    },
  },
];

export const getPersona = (id: PersonaId | null | undefined): PersonaDefinition | null =>
  PERSONAS.find((p) => p.id === id) ?? null;

// ───────────────────────────────────────────────────────────────────────────
// Characters — identity-only overlays (no progress/timing/journey stage).
// Combined with a persona on top via applyCharacter.
// ───────────────────────────────────────────────────────────────────────────

export interface CharacterDefinition {
  id: string;
  label: string;
  userOverrides: NonNullable<PersonaDefinition["userOverrides"]>;
  memoryOverrides: NonNullable<PersonaDefinition["memoryOverrides"]>;
  aiOutputOverrides: NonNullable<PersonaDefinition["aiOutputOverrides"]>;
}

const MARCUS = PERSONAS.find((p) => p.id === "marcus_b2b")!;
const SOPHIE = PERSONAS.find((p) => p.id === "sophie_b2c")!;

export const CHARACTERS: CharacterDefinition[] = [
  {
    id: "marcus",
    label: "B2B Coach — Marcus",
    userOverrides: {
      name: "Marcus Reid",
      firstName: "Marcus",
      lastName: "Reid",
      email: "marcus@preview.local",
      inviteCode: "B2BCOACH",
    },
    memoryOverrides: { ...(MARCUS.memoryOverrides ?? {}), name: "Marcus Reid" },
    aiOutputOverrides: { ...(MARCUS.aiOutputOverrides ?? {}) },
  },
  {
    id: "sophie",
    label: "B2C Coach — Sophie",
    userOverrides: {
      name: "Sophie Harte",
      firstName: "Sophie",
      lastName: "Harte",
      email: "sophie@preview.local",
      inviteCode: "B2CCOACH",
    },
    memoryOverrides: { ...(SOPHIE.memoryOverrides ?? {}), name: "Sophie Harte" },
    aiOutputOverrides: { ...(SOPHIE.aiOutputOverrides ?? {}) },
  },
];

export const getCharacter = (id: string | null | undefined): CharacterDefinition | null =>
  CHARACTERS.find((c) => c.id === id) ?? null;

/** Pure overlay: apply character identity + AI outputs on top of state. */
export function applyCharacter(state: AppState, characterId: string | null | undefined): AppState {
  const character = getCharacter(characterId);
  if (!character) return state;
  const baseUser = state.user ?? STUB_USER;
  return {
    ...state,
    user: { ...baseUser, ...character.userOverrides },
    memory: { ...state.memory, ...character.memoryOverrides },
    challenge: {
      ...state.challenge,
      aiOutputs: { ...state.challenge.aiOutputs, ...character.aiOutputOverrides },
    },
  };
}

/** Read character id from QA localStorage without importing qaPreview (avoids cycle). */
function readQaCharacterId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("leadioPreviewState");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.character === "string" ? parsed.character : null;
  } catch {
    return null;
  }
}


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

const STUB_USER = {
  name: "Persona Preview",
  email: "persona@preview.local",
  inviteCode: "PERSONA",
  referredBy: null,
  role: "participant" as const,
  joinedAt: new Date().toISOString(),
  isFoundingPartner: false,
  foundingPartnerRank: null,
  foundingPartnerJoinedAt: null,
  isEligibleForPromotion: false,
  qualityScore: 0,
  adminBoost: 0,
  adminBadge: null,
  submittedUrl: null,
};

/** Apply persona overlay. Pure — never mutates input or persists. */
export function applyPersona(state: AppState, personaId: PersonaId): AppState {
  const persona = getPersona(personaId);
  if (!persona) return state;
  // If there's no user yet (pre-auth admin preview, demo session) synthesize
  // a stub so the overlay always renders. Never persisted.
  const baseUser = state.user ?? STUB_USER;

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
  const completedThroughDay = persona.dayProgress[3] >= 1 ? 3 : persona.dayProgress[2] >= 1 ? 2 : persona.dayProgress[1] >= 1 ? 1 : 0;
  const seeded = seedCompletedDayData({ ...state, challenge: { ...state.challenge, tasks, aiOutputs } }, completedThroughDay);

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

  // currentDay: force to highest day reached by timing OR progress.
  // We intentionally ignore the stored currentDay so the persona can move
  // BACK to an earlier day (e.g. "Fresh signup") even if state was advanced.
  const progressDay = persona.dayProgress[3] >= 1 ? 3 : persona.dayProgress[2] >= 1 ? 3 : persona.dayProgress[1] >= 1 ? 2 : 1;
  const currentDay = Math.min(3, Math.max(timing.currentDay, progressDay));

  const assessment = state.assessment ?? ({
    ...generateResult(SAMPLE_ASSESSMENT_ANSWERS),
    mode: "challenge",
  } as AppState["assessment"]);

  // 7. Apply explicit overrides (user/memory/aiOutputs) last so they win.
  const finalUser = { ...baseUser, ...(persona.userOverrides ?? {}), joinedAt: timing.joinedAtIso };
  const finalMemory = { ...seeded.memory, ...(persona.memoryOverrides ?? {}) };
  const finalAiOutputs = { ...seeded.aiOutputs, ...(persona.aiOutputOverrides ?? {}) };

  const result: AppState = {
    ...state,
    user: finalUser,
    memory: finalMemory,
    assessment,

    challenge: {
      ...state.challenge,
      startedAt: timing.startedAtIso,
      endsAt: timing.endsAtIso,
      currentDay,
      completed,
      tasks: seeded.tasks,
      aiOutputs: finalAiOutputs,
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

  // 8. If a character is selected in QA state, overlay its identity on top.
  return applyCharacter(result, readQaCharacterId());
}

