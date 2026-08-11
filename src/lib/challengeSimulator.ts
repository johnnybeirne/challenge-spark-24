// Owner-only challenge simulator helpers.
// Everything here is derived from the app's real quiz data, routes and
// persona presets — nothing about the participant journey is hardcoded twice.
// Read-only: no Supabase writes, no real participant data is touched.

import {
  questions as defaultQuestions,
  calculateDiagnosticScore,
  getDiagnosticResult,
  type AssessmentQuestion,
} from "@/lib/assessmentData";
import { archetypeToTier, type QaArchetype } from "@/lib/qaPreview";
import { PERSONAS, type PersonaId } from "@/lib/personas";

export type DiagnosticTier = "low" | "mid" | "high";

export const SIMULATOR_ARCHETYPES: QaArchetype[] = ["pioneer", "architect", "authority"];

/** Label + band for each archetype, read from the app's own scoring engine. */
export interface ArchetypeInfo {
  id: QaArchetype;
  tier: DiagnosticTier;
  title: string;
  message: string;
  /** Inclusive score band that resolves to this archetype. */
  minScore: number;
  maxScore: number;
}

/** Walk every possible score once and group them into the app's real bands. */
export function getArchetypeInfo(total = defaultQuestions.length): ArchetypeInfo[] {
  const byTier = new Map<DiagnosticTier, ArchetypeInfo>();
  for (let score = 0; score <= total; score++) {
    const r = getDiagnosticResult(score);
    const existing = byTier.get(r.level);
    if (!existing) {
      byTier.set(r.level, {
        id: SIMULATOR_ARCHETYPES.find((a) => archetypeToTier(a) === r.level)!,
        tier: r.level,
        title: r.title,
        message: r.message,
        minScore: score,
        maxScore: score,
      });
    } else {
      existing.maxScore = score;
    }
  }
  return SIMULATOR_ARCHETYPES.map((a) => byTier.get(archetypeToTier(a))!).filter(Boolean);
}

/**
 * Which option index (0 = first option, 1 = second) earns a point for a
 * question. Derived by running the real scorer, so reverse-scored questions
 * are handled without duplicating the list here.
 */
export function scoringOptionIndex(question: AssessmentQuestion): number {
  const first = question.options[0]?.value ?? "yes";
  const scored = calculateDiagnosticScore({ [question.id]: first });
  return scored > 0 ? 0 : 1;
}

/**
 * Build the click plan (one option index per question) that lands on the
 * requested archetype band.
 */
export function buildAnswerPlan(
  archetype: QaArchetype,
  questions: AssessmentQuestion[] = defaultQuestions,
): { plan: number[]; targetScore: number } {
  const info = getArchetypeInfo(questions.length).find((a) => a.id === archetype);
  const min = info?.minScore ?? 0;
  const max = Math.min(info?.maxScore ?? questions.length, questions.length);
  const targetScore = Math.round((min + max) / 2);
  const plan = questions.map((q, i) => {
    const scoringIdx = scoringOptionIndex(q);
    const shouldScore = i < targetScore;
    return shouldScore ? scoringIdx : 1 - scoringIdx;
  });
  return { plan, targetScore };
}

export function randomArchetype(): QaArchetype {
  return SIMULATOR_ARCHETYPES[Math.floor(Math.random() * SIMULATOR_ARCHETYPES.length)];
}

/* ───── Screen sequence (real routes, real components) ───── */

export interface SimulatorScreen {
  id: string;
  name: string;
  note: string;
  path: string;
  kind: "quiz" | "page";
  /** Persona preset used to fake progress on the demo participant only. */
  persona?: PersonaId;
}

const personaExists = (id: PersonaId) => PERSONAS.some((p) => p.id === id);
const persona = (id: PersonaId): PersonaId | undefined => (personaExists(id) ? id : undefined);

export const SIMULATOR_SCREENS: SimulatorScreen[] = [
  { id: "quiz", name: "Lead flow quiz", note: "Auto-played question by question", path: "/assessment", kind: "quiz" },
  { id: "results", name: "Result and archetype", note: "Score, band and teaser", path: "/results", kind: "page" },
  { id: "join", name: "Join the challenge", note: "Signup and account creation", path: "/challenge/join", kind: "page" },
  { id: "dashboard", name: "Challenge dashboard", note: "First view after joining", path: "/challenger-dashboard", kind: "page", persona: persona("fresh") },
  { id: "day1", name: "Day 1", note: "Open from signup", path: "/challenge/day-1", kind: "page", persona: persona("fresh") },
  { id: "day2", name: "Day 2", note: "Clock moved forward one window", path: "/challenge/day/2", kind: "page", persona: persona("done_day_1") },
  { id: "day3", name: "Day 3", note: "Clock moved forward two windows", path: "/challenge/day/3", kind: "page", persona: persona("done_day_2") },
  { id: "invites", name: "Invite friends", note: "Points and invite links", path: "/invites", kind: "page", persona: persona("done_day_2") },
  { id: "unlocks", name: "Unlocks", note: "What the participant has opened", path: "/unlocks", kind: "page", persona: persona("done_day_2") },
];

export const SPEEDS = [
  { label: "Slow", value: 0.5 },
  { label: "1x", value: 1 },
  { label: "2x", value: 2 },
] as const;

/** Base dwell per walkthrough screen, in ms, before speed is applied. */
export const BASE_DWELL_MS = 6000;
