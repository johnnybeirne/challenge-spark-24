// Day Challenge content config — admin-editable. Mirrors the exact shape used
// by src/pages/DayChallenge.tsx so the CMS edits the same fields the user sees.

export type DayTaskInputType = "input" | "textarea" | "checkbox" | "url";

export interface DayTaskConfig {
  key: string;
  label: string;
  hasTextarea: boolean;
  inputType: DayTaskInputType;
  placeholder: string;
  helper: string;
}

export interface DayContentConfig {
  title: string;
  intro: string;
  lesson: string;
  reinforcement: string;
  nudge: string;
  completion: string;
  tasks: DayTaskConfig[];
}

export interface DayContent {
  day2: DayContentConfig;
}

export const STORAGE_KEY = "leadio_day_content";
const CHANGE_EVENT = "leadio:day-content-changed";

export const defaultDayContent: DayContent = {
  day2: {
    title: "Day 2: Build Your Lead Magnet Quiz",
    intro: "Today you’ll create the quiz that acts as the entry point to your challenge.",
    lesson:
      "A strong quiz helps people see where they are now, notice what is missing, understand why the challenge matters, and feel motivated to continue.",
    reinforcement: "This is not just a lead magnet. This is the diagnostic inside your challenge.",
    nudge: "Keep it focused — each question should reveal a different gap.",
    completion: "Your quiz is mapped. Now turn it into a simple working challenge.",
    tasks: [
      {
        key: "quiz_questions",
        label: "Your Questions",
        hasTextarea: true,
        inputType: "textarea",
        placeholder: "Write your own quiz questions here.",
        helper: "Use 5 to 9 yes/no questions. Each question should reveal a different gap. Avoid repeating the same idea in different ways.",
      },
    ],
  },
};

function mergeDay(base: DayContentConfig, partial: any): DayContentConfig {
  const merged: DayContentConfig = { ...base, ...(partial || {}) };
  if (Array.isArray(partial?.tasks)) {
    merged.tasks = partial.tasks.map((t: any, i: number) => ({
      ...(base.tasks[i] || { key: `task_${i}`, label: "", hasTextarea: false, inputType: "checkbox", placeholder: "", helper: "" }),
      ...t,
    }));
  }
  return merged;
}

export function loadDayContent(): DayContent {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultDayContent;
    const parsed = JSON.parse(raw);
    return {
      day2: mergeDay(defaultDayContent.day2, parsed.day2),
    };
  } catch {
    return defaultDayContent;
  }
}

export function saveDayContent(next: DayContent) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {}
}

export function subscribeDayContent(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener(CHANGE_EVENT, handler);
  const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) cb(); };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", onStorage);
  };
}
