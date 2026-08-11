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
  /** "quiz" = lead-flow quiz autoplay, "form" = Day 1 step-through autoplay. */
  kind: "quiz" | "form" | "page";
  /** Persona preset used to fake progress on the demo participant only. */
  persona?: PersonaId;
  /**
   * Which signup-anchored window the demo clock sits in for this screen.
   * 1 = Day 1 is live, 2 = Day 2 is live (so Day 1 has rolled past and the real
   * gate locks it), 3 = Day 3 is live. The window length is read from the gate
   * settings at run time, never hardcoded.
   */
  windowIndex?: number;
  /** Direct referrals the demo participant has on this screen. */
  directReferrals?: number;
  /** Dwell time for this screen in ms, before speed is applied. Defaults to BASE_DWELL_MS. */
  dwellMs?: number;
}

const personaExists = (id: PersonaId) => PERSONAS.some((p) => p.id === id);
const persona = (id: PersonaId): PersonaId | undefined => (personaExists(id) ? id : undefined);

export const SIMULATOR_SCREENS: SimulatorScreen[] = [
  { id: "quiz", name: "Lead flow quiz", note: "Auto-played question by question", path: "/assessment", kind: "quiz" },
  { id: "results", name: "Result and archetype", note: "Score, band and teaser", path: "/results", kind: "page", dwellMs: 20000 },
  { id: "join", name: "Join the challenge", note: "Signup and account creation", path: "/challenge/join", kind: "page", dwellMs: 9000 },
  { id: "dashboard", name: "Challenge dashboard", note: "First view after joining", path: "/challenger-dashboard", kind: "page", persona: persona("fresh"), windowIndex: 1, dwellMs: 12000 },
  { id: "day1", name: "Day 1", note: "Auto-played step by step, live window", path: "/challenge/day-1", kind: "form", persona: persona("fresh"), windowIndex: 1 },

  { id: "rollover", name: "Day 1 window closes", note: "Clock rolls into Day 2, day nav re-locks", path: "/challenger-dashboard", kind: "page", persona: persona("done_day_1"), windowIndex: 2 },
  { id: "day1Locked", name: "Day 1 locked", note: "Real pay or invite gate on a past day", path: "/challenge/day-1", kind: "page", persona: persona("done_day_1"), windowIndex: 2, dwellMs: 12000 },
  { id: "day2", name: "Day 2", note: "Open day in its live window", path: "/challenge/day/2", kind: "page", persona: persona("done_day_1"), windowIndex: 2 },
  { id: "day2Locked", name: "Day 2 locked", note: "Day 2 rolls past as Day 3 opens", path: "/challenge/day/2", kind: "page", persona: persona("done_day_2"), windowIndex: 3 },
  { id: "day3", name: "Day 3", note: "Open day in its live window", path: "/challenge/day/3", kind: "page", persona: persona("done_day_2"), windowIndex: 3 },
  { id: "invites", name: "Invite friends", note: "Points and invite links", path: "/invites", kind: "page", persona: persona("done_day_2"), windowIndex: 3, directReferrals: 1, dwellMs: 10000 },
  { id: "unlocks", name: "Unlocks", note: "What the participant has opened", path: "/unlocks", kind: "page", persona: persona("done_day_2"), windowIndex: 3 },
];

/**
 * Signup anchor that puts "now" in the middle of the given window, so the real
 * schedule makes that day live and every earlier day past.
 */
export function anchorForWindow(windowIndex: number, windowHours: number): string {
  const idx = Math.max(1, windowIndex || 1);
  const hoursAgo = (idx - 1) * windowHours + windowHours / 2;
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}


export const SPEEDS = [
  { label: "Slow", value: 0.5 },
  { label: "1x", value: 1 },
  { label: "2x", value: 2 },
] as const;

/** Base dwell per walkthrough screen, in ms, before speed is applied. */
export const BASE_DWELL_MS = 6000;

/* ───── Shared auto-answer driver ─────
 * One mechanism, two surfaces: the lead-flow quiz and the Day 1 step-through.
 * Everything is derived from the rendered DOM of the real screens, so no
 * question, option or field is duplicated here.
 */

const isVisible = (el: HTMLElement) =>
  !!el.offsetParent && !el.hidden && el.getClientRects().length > 0;

const usableButtons = (doc: Document) =>
  Array.from(doc.querySelectorAll<HTMLButtonElement>("button")).filter(
    (b) => !b.disabled && isVisible(b),
  );

/** Answer buttons on the lead-flow quiz (large bordered option cards). */
const quizOptionButtons = (doc: Document) =>
  Array.from(doc.querySelectorAll<HTMLButtonElement>("button")).filter(
    (b) => b.className.includes("rounded-2xl") && b.className.includes("border-2"),
  );

/**
 * Play one tick of the lead-flow quiz. Returns the question index it answered,
 * or null when nothing was actionable this tick.
 */
export function autoplayQuizTick(doc: Document, plan: number[]): number | null {
  const answerButtons = quizOptionButtons(doc);
  if (answerButtons.length >= 2) {
    if (answerButtons.every((b) => b.disabled)) return null; // mid-transition
    const dots = Array.from(doc.querySelectorAll<HTMLElement>("div.h-1\\.5"));
    const current = Math.max(0, dots.findIndex((d) => d.className.includes("w-8")));
    const choice = plan[current] ?? 0;
    answerButtons[choice]?.click();
    return current;
  }
  // Still on the landing intro — press the quiz CTA.
  const cta = usableButtons(doc).find((b) => /quiz|start|begin|diagnos/i.test(b.textContent ?? ""));
  cta?.click();
  return null;
}

/* ───── Day 1 scripted answers ─────
 * A fixed set of fictitious but sensible answers for the real Day 1 questions,
 * so an audience watches the demo participant fill the form in front of them.
 * Matched against each field's own placeholder / label text, so the script
 * survives copy edits on the Day 1 screen.
 */
export interface Day1ScriptEntry {
  /** Matches the field's placeholder or nearby question text. */
  match: RegExp;
  value: string;
}

export const DAY1_SCRIPT: Day1ScriptEntry[] = [
  // Step 1 — who you serve
  {
    match: /independent coaches|new parents|who (do you|specifically)|audience/i,
    value: "Independent business coaches who sell one to one packages",
  },
  // Step 10 — superpower
  {
    match: /superpower|complex ideas|simple and actionable/i,
    value: "I turn a messy offer into one clear sentence people instantly understand",
  },
  // Step 2 — most painful problem
  {
    match: /painful problem|frustration|obstacle|stuck/i,
    value: "They cannot explain what they do, so good prospects go quiet after the first call",
  },
  // Step 3 — process
  {
    match: /process|steps|framework|walk (them|they) through|pinpoint|daily action/i,
    value: "I walk them through a three step clarity framework, one focused step each day",
  },
  // Step 9 — outcome
  {
    match: /walk away|transformation|by the end of|result they/i,
    value: "A one line pitch they are proud to say out loud and three booked conversations",
  },
];

/** Multi select preferences (Day 1 expert type) — first match wins, in order. */
export const DAY1_CHOICE_PREFERENCES: RegExp[] = [/coach/i, /consultant/i, /course/i];

/** Text near a field that helps identify which question it belongs to. */
const fieldContext = (field: HTMLElement): string => {
  const holder = field.closest("div")?.parentElement ?? field.parentElement;
  return [
    (field as HTMLInputElement).placeholder ?? "",
    (field.getAttribute("aria-label") ?? ""),
    (holder?.textContent ?? "").slice(0, 400),
  ].join(" ");
};

/** The scripted answer for a field, falling back to its own placeholder. */
export function scriptedAnswerFor(field: HTMLInputElement | HTMLTextAreaElement): string {
  const context = fieldContext(field);
  const hit = DAY1_SCRIPT.find((entry) => entry.match.test(context));
  if (hit) return hit.value;
  return demoValueFor(field);
}

/** Turn a field's own placeholder ("e.g. Independent coaches.") into a demo value. */
const demoValueFor = (field: HTMLInputElement | HTMLTextAreaElement): string => {
  const raw = (field.placeholder || "").trim();
  const cleaned = raw
    .replace(/^e\.?g\.?:?\s*/i, "")
    .replace(/\s*\.\.\.$/, "")
    .replace(/[.\s]+$/, "")
    .trim();
  return cleaned || "Independent coaches who want more qualified leads";
};

/** Write into a React-controlled field so its onChange fires. */
const setFieldValue = (field: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  const win = field.ownerDocument.defaultView ?? window;
  const proto =
    field instanceof (win as any).HTMLTextAreaElement || field.tagName === "TEXTAREA"
      ? (win as any).HTMLTextAreaElement.prototype
      : (win as any).HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(field, value);
  else field.value = value;
  field.dispatchEvent(new (win as any).Event("input", { bubbles: true }));
};

/**
 * Type a value into a React-controlled field one character at a time so the
 * audience watches it appear. Resolves early when `isCancelled` flips (pause).
 */
export async function typeIntoField(
  field: HTMLInputElement | HTMLTextAreaElement,
  value: string,
  opts: { charDelayMs?: number; isCancelled?: () => boolean } = {},
): Promise<boolean> {
  const delay = Math.max(4, opts.charDelayMs ?? 32);
  const isCancelled = opts.isCancelled ?? (() => false);
  try {
    field.focus();
  } catch { /* detached */ }
  for (let i = 1; i <= value.length; i++) {
    if (isCancelled()) return false;
    if (!field.isConnected) return false;
    setFieldValue(field, value.slice(0, i));
    await new Promise((r) => setTimeout(r, delay));
  }
  if (!field.isConnected) return false;
  const win = field.ownerDocument.defaultView ?? window;
  field.dispatchEvent(new (win as any).Event("change", { bubbles: true }));
  return field.value.trim().length > 0;
}

const FORM_CTA = /continue|next|complete|finish|generate|create|save|let'?s|got it|show me|unlock/i;

/** Visible, empty, editable free text field on the current step, if any. */
export function findFormField(
  doc: Document,
): HTMLInputElement | HTMLTextAreaElement | null {
  const fields = Array.from(
    doc.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("textarea, input[type='text']"),
  ).filter((f) => !f.disabled && !f.readOnly && isVisible(f));
  return fields.find((f) => !f.value.trim()) ?? null;
}

/** Unpicked option cards (single or multi select) on the current step. */
export function findFormChoices(doc: Document): HTMLButtonElement[] {
  return Array.from(
    doc.querySelectorAll<HTMLButtonElement>('button[role="radio"], button[role="checkbox"]'),
  ).filter(
    (b) => !b.disabled && isVisible(b) && b.getAttribute("aria-checked") !== "true",
  );
}

/** The scripted choice to click next, preferring the script's option order. */
export function preferredChoice(choices: HTMLButtonElement[]): HTMLButtonElement | null {
  if (choices.length === 0) return null;
  for (const pref of DAY1_CHOICE_PREFERENCES) {
    const hit = choices.find((c) => pref.test((c.textContent ?? "").trim()));
    if (hit) return hit;
  }
  return choices[0];
}

/**
 * Answer the current step without advancing it: pick a choice, or fill a free
 * text field instantly. Kept for non-visible use (fallback path).
 */
export function autoplayFormAnswerTick(doc: Document): boolean {
  const choice = preferredChoice(findFormChoices(doc));
  if (choice) {
    choice.click();
    return true;
  }
  const empty = findFormField(doc);
  if (empty) {
    setFieldValue(empty, scriptedAnswerFor(empty));
    return true;
  }
  return false;
}

/** A cheap fingerprint of the current step, used to detect real progress. */
export function formStepSignature(doc: Document): string {
  const heading = (doc.querySelector("h1")?.textContent ?? "").trim();
  const field = Array.from(
    doc.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("textarea, input[type='text']"),
  ).filter((f) => isVisible(f));
  const choices = findFormChoices(doc).length;
  return [
    heading,
    field.map((f) => `${f.placeholder}:${f.value.length}`).join("|"),
    `c${choices}`,
  ].join("~");
}

/** Wait until `check` returns a value, or give up after `timeoutMs`. */
export async function waitFor<T>(
  check: () => T | null | undefined,
  timeoutMs = 6000,
  pollMs = 120,
): Promise<T | null> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = check();
    if (value) return value;
    if (Date.now() > deadline) return null;
    await new Promise((r) => setTimeout(r, pollMs));
  }
}


/** Strong, unambiguous advance labels — checked before the looser pattern. */
const PRIMARY_CTA = /^(continue|next|complete day|finish|complete)/i;

/**
 * The step's primary "advance the flow" button. Wide, primary-styled buttons
 * win over incidental prompt pills that happen to contain a CTA word.
 */
export function findFormCta(doc: Document): HTMLElement | null {
  const buttons = usableButtons(doc).filter((b) => FORM_CTA.test((b.textContent ?? "").trim()));
  if (buttons.length === 0) return null;
  const score = (b: HTMLButtonElement) => {
    const text = (b.textContent ?? "").trim();
    let n = 0;
    if (PRIMARY_CTA.test(text)) n += 4;
    if (b.className.includes("w-full")) n += 3;
    if (b.getBoundingClientRect().width > 320) n += 1;
    if (text.length > 70) n -= 3; // prompt pills and long helper copy
    return n;
  };
  return [...buttons].sort((a, b) => score(b) - score(a))[0] ?? null;
}

/**
 * Play one tick of a step-through screen such as Day 1: pick a choice, fill a
 * free-text field, or press the step's primary button. Returns true when it
 * acted, so the caller can pace itself the same way the quiz does.
 */
export function autoplayFormTick(doc: Document): boolean {
  if (autoplayFormAnswerTick(doc)) return true;
  const cta = findFormCta(doc);
  if (cta) {
    cta.click();
    return true;
  }
  return false;
}

/**
 * The nav item, menu entry or CTA on the current screen that leads to
 * `nextPath`. Used so the walkthrough visibly clicks its way forward instead
 * of silently swapping the stage.
 */
export function findNavTarget(doc: Document, nextPath: string, nextName = ""): HTMLElement | null {
  // Nav chrome often sits inside fixed containers, where offsetParent is null,
  // so measure boxes instead. Skip the QA/preview chrome the demo shell adds.
  const onScreen = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return r.width > 8 && r.height > 8;
  };
  const clickable = Array.from(
    doc.querySelectorAll<HTMLElement>("a[href], button, [role='button'], [role='link']"),
  ).filter(
    (el) =>
      onScreen(el) &&
      !(el as HTMLButtonElement).disabled &&
      !/exit preview|qa mode|focus mode|take the tour/i.test((el.textContent ?? "").trim()),
  );


  // 1. A real link to the next screen.
  const byHref = clickable.find((el) => {
    const href = el.getAttribute("href");
    return !!href && (href === nextPath || href.startsWith(`${nextPath}?`) || href.startsWith(`${nextPath}/`));
  });
  if (byHref) return byHref;

  // 2. A control whose label matches the next screen's name.
  const words = nextName.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  if (words.length) {
    const byLabel = clickable.find((el) => {
      const text = (el.textContent ?? "").trim().toLowerCase();
      return text.length > 0 && text.length < 60 && words.every((w) => text.includes(w));
    });
    if (byLabel) return byLabel;
  }

  // 3. Any primary flow button on the screen.
  return clickable.find((el) => FORM_CTA.test((el.textContent ?? "").trim())) ?? null;
}

