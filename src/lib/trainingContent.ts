// Training content config — admin-editable, separate from user watched-state.
// Stored in localStorage under the existing app prefix.

export interface DashboardTrainingConfig {
  enabled: boolean;
  title: string;
  videoTitle: string;
  subtitle: string;
  videoUrl: string;
  placeholderText: string;
  supportingText: string;
  primaryCtaText: string;
  secondaryCtaText: string;
}

export interface DayTrainingConfig {
  enabled: boolean;
  title: string;
  videoTitle: string;
  subtitle: string;
  videoUrl: string;
  placeholderText: string;
  keyLesson: string;
  ctaText: string;
}

export interface TrainingContent {
  dashboard: DashboardTrainingConfig;
  day1: DayTrainingConfig;
  day2: DayTrainingConfig;
  day3: DayTrainingConfig;
}

export const STORAGE_KEY = "leadio_training_content";
const CHANGE_EVENT = "leadio:training-content-changed";

export const defaultTrainingContent: TrainingContent = {
  dashboard: {
    enabled: true,
    title: "Watch this first",
    videoTitle: "How Leadio works",
    subtitle: "Before you start Day 1, understand the system you’re building.",
    videoUrl: "",
    placeholderText: "Training video goes here",
    supportingText:
      "You’ll learn how your challenge works, how referrals help it grow, and what to focus on over the next 3 days.",
    primaryCtaText: "Start Day 1",
    secondaryCtaText: "Invite builders first",
  },
  day1: {
    enabled: true,
    title: "Day 1 training",
    videoTitle: "Shape your challenge",
    subtitle:
      "Today you define who your challenge is for, what problem it solves, and the simple result people should get.",
    videoUrl: "",
    placeholderText: "Day 1 video goes here",
    keyLesson:
      "Keep it specific. A clear challenge is easier to build, easier to explain, and easier to share.",
    ctaText: "Mark Day 1 training as watched",
  },
  day2: {
    enabled: true,
    title: "Day 2 training",
    videoTitle: "Build the experience",
    subtitle: "Today you turn your challenge idea into a simple guided experience people can follow.",
    videoUrl: "",
    placeholderText: "Day 2 video goes here",
    keyLesson: "Do not overbuild. The goal is a clear path from start to result.",
    ctaText: "Mark Day 2 training as watched",
  },
  day3: {
    enabled: true,
    title: "Day 3 training",
    videoTitle: "Launch and grow",
    subtitle: "Today you make your challenge visible and add the actions that help it grow.",
    videoUrl: "",
    placeholderText: "Day 3 video goes here",
    keyLesson: "This only grows if people see it. Launch, share, and invite.",
    ctaText: "Mark Day 3 training as watched",
  },
};

export function loadTrainingContent(): TrainingContent {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultTrainingContent;
    const parsed = JSON.parse(raw);
    return {
      dashboard: { ...defaultTrainingContent.dashboard, ...(parsed.dashboard || {}) },
      day1: { ...defaultTrainingContent.day1, ...(parsed.day1 || {}) },
      day2: { ...defaultTrainingContent.day2, ...(parsed.day2 || {}) },
      day3: { ...defaultTrainingContent.day3, ...(parsed.day3 || {}) },
    };
  } catch {
    return defaultTrainingContent;
  }
}

export function saveTrainingContent(next: TrainingContent) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {}
}

export function subscribeTrainingContent(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", (e) => { if (e.key === STORAGE_KEY) cb(); });
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

/** Parse common video URLs into an embed URL. Returns null if not embeddable. */
export function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    // YouTube
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    // Vimeo
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    // Direct mp4
    if (/\.(mp4|webm|ogg)(\?|$)/i.test(u.pathname)) return url;
  } catch {
    return null;
  }
  return null;
}

export function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}
