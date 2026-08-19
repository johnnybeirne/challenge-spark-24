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
  day3: DayContentConfig;
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
  day3: {
    title: "Day 3: Build Your AI-Powered Challenge",
    intro: "Today you’ll turn your idea and quiz into a simple challenge.",
    lesson:
      "Your first version does not need to be complex. It only needs a clear promise, a quiz entry point, a simple result or diagnosis, 3 short challenge steps, and a reason for people to invite others.",
    reinforcement: "Build the smallest useful version first.",
    nudge: "",
    completion: "You built a working challenge. That puts you ahead of most.",
    tasks: [
      { key: "landing_page", label: "Create your challenge landing page", hasTextarea: false, inputType: "checkbox", placeholder: "", helper: "" },
      { key: "lead_magnet_quiz", label: "Add your lead magnet quiz", hasTextarea: false, inputType: "checkbox", placeholder: "", helper: "" },
      { key: "result_page", label: "Add your result page", hasTextarea: false, inputType: "checkbox", placeholder: "", helper: "" },
      { key: "day_content", label: "Create Day 1, Day 2, Day 3 content", hasTextarea: false, inputType: "checkbox", placeholder: "", helper: "" },
      { key: "invite_step", label: "Add a simple invite step", hasTextarea: false, inputType: "checkbox", placeholder: "", helper: "" },
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
      day3: mergeDay(defaultDayContent.day3, parsed.day3),
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
