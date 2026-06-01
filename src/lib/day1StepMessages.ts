// Editable Day 1 step messages with bracket-tag templating.
// Used by the admin Day 1 Step Editor for live preview + persistence,
// and consumed by src/components/Day1Setup.tsx via useDay1Templates().

import { useEffect, useState } from "react";


export type Day1TagKey =
  | "first_name"
  | "audience"
  | "superpower"
  | "challenge_type"
  | "problem"
  | "process"
  | "outcome"
  | "promise";

export interface Day1StepMessage {
  id: string;
  label: string;
  message: string;
}

export const DAY1_STORAGE_KEY = "admin.day1StepMessages.v1";

export const DAY1_EXAMPLE_VALUES: Record<Day1TagKey, string> = {
  first_name: "Johnny",
  audience: "independent coaches and consultants",
  superpower: "making complex ideas feel simple",
  challenge_type: "quick-win",
  problem: "they can't explain what they do in one sentence",
  process: "a 3-step clarity framework",
  outcome: "a one-line pitch they're proud to say out loud",
  promise:
    "help independent coaches turn a fuzzy offer into a one-line pitch in 3 days",
};

export const DAY1_TAG_KEYS: Day1TagKey[] = Object.keys(
  DAY1_EXAMPLE_VALUES,
) as Day1TagKey[];

export const defaultDay1Steps: Day1StepMessage[] = [
  {
    id: "step-1",
    label: "Step 1 of 8 — Audience type",
    message:
      "Welcome [first_name]. Before we shape your challenge, who do you mainly serve — other businesses or individual consumers?",
  },
  {
    id: "step-2",
    label: "Step 2 of 8 — Who specifically",
    message:
      "Got it [first_name]. Tell me a bit more — who specifically do you help inside that group?",
  },
  {
    id: "step-3",
    label: "Step 3 of 8 — Superpower",
    message:
      "So [first_name], you work with [audience]. What's your superpower when it comes to helping them?",
  },
  {
    id: "step-4",
    label: "Step 4 of 8 — Challenge type",
    message:
      "Love it — [superpower]. What kind of result do you want this challenge to deliver for [audience]?",
  },
  {
    id: "step-5",
    label: "Step 5 of 8 — Specific problem",
    message:
      "Nice. A [challenge_type] challenge it is. What's the single most painful problem [audience] face right now?",
  },
  {
    id: "step-6",
    label: "Step 6 of 8 — Your process",
    message:
      "So the problem is [problem]. Walk me through how you usually help them solve it.",
  },
  {
    id: "step-7",
    label: "Step 7 of 8 — Outcome",
    message:
      "Got it. You take them through [process]. What's the tangible result they walk away with?",
  },
  {
    id: "step-8",
    label: "Step 8 of 8 — Promise review",
    message:
      "Here's your promise, [first_name]: [promise]. Does that feel right to you?",
  },
];

export const loadDay1Steps = (): Day1StepMessage[] => {
  if (typeof window === "undefined") return defaultDay1Steps;
  try {
    const raw = window.localStorage.getItem(DAY1_STORAGE_KEY);
    if (!raw) return defaultDay1Steps;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultDay1Steps;
    // Re-seed by id so new defaults appear if defaults grow over time.
    return defaultDay1Steps.map((def) => {
      const match = parsed.find(
        (p: Day1StepMessage) => p && p.id === def.id,
      );
      return match
        ? { ...def, message: String(match.message ?? def.message) }
        : def;
    });
  } catch {
    return defaultDay1Steps;
  }
};

export const saveDay1Steps = (steps: Day1StepMessage[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DAY1_STORAGE_KEY, JSON.stringify(steps));
};

export const renderDay1Preview = (
  template: string,
  values: Record<Day1TagKey, string> = DAY1_EXAMPLE_VALUES,
): string =>
  template.replace(/\[([a-z_]+)\]/gi, (match, raw) => {
    const key = String(raw).toLowerCase() as Day1TagKey;
    const value = values[key];
    return value && value.length > 0 ? value : match;
  });
