/**
 * Day 3 participant-facing copy — one shared source for the Challenger screen
 * (src/pages/DayChallenge.tsx, dayNum === 3) and the owner editor
 * (src/pages/AdminDay3.tsx).
 *
 * Every string lives in site_content on page "day3" as `section.key`.
 * The `fallback` below is the seed value: the editor writes it to the database
 * on first save, and the Challenger renders the database value when present.
 *
 * Nothing here is stored in localStorage, and no seeded default names an
 * external product or tool.
 */

export type Day3Field = {
  section: string;
  key: string;
  label: string;
  helper: string;
  fallback: string;
  multiline?: boolean;
  rows?: number;
};

export const DAY3_PAGE = "day3";

/** Number of action tasks the editor exposes. */
export const DAY3_TASK_KEYS = [
  "landing_page",
  "lead_magnet_quiz",
  "result_page",
  "day_content",
  "invite_step",
] as const;

export const HEADER_FIELDS: Day3Field[] = [
  {
    section: "header",
    key: "eyebrow",
    label: "Eyebrow",
    helper: "Small uppercase line above the title.",
    fallback: "Day 3",
  },
  {
    section: "header",
    key: "title",
    label: "Page title",
    helper: "Main heading on the Day 3 screen.",
    fallback: "Build Your AI-Powered Challenge",
  },
  {
    section: "header",
    key: "subtitle",
    label: "Page subtitle",
    helper: "Line under the title.",
    fallback: "Today you’ll turn your idea and quiz into a simple challenge.",
    multiline: true,
    rows: 2,
  },
  {
    section: "header",
    key: "context",
    label: "Italic context line",
    helper: "Italic supporting line under the subtitle. Leave empty to hide it.",
    fallback: "Build the smallest useful version first, then improve it as people go through it.",
    multiline: true,
    rows: 2,
  },
];

export const TRAINING_FIELDS: Day3Field[] = [
  {
    section: "video",
    key: "title",
    label: "Video pop-up title",
    helper: "Title of the Day 3 briefing dialog.",
    fallback: "Day 3 — Design the Challenge Experience",
  },
  {
    section: "video",
    key: "subtitle",
    label: "Video pop-up subtitle",
    helper: "Line under that title.",
    fallback: "Watch this before mapping your 3 day arc.",
  },
  {
    section: "training",
    key: "lesson",
    label: "Lesson text",
    helper: "Main teaching paragraph inside the optional briefing panel.",
    fallback:
      "Your first version does not need to be complex. It only needs a clear promise, a quiz entry point, a simple result or diagnosis, 3 short challenge steps, and a reason for people to invite others.",
    multiline: true,
    rows: 4,
  },
  {
    section: "training",
    key: "reinforcement",
    label: "Reinforcement line",
    helper: "Short line under the lesson.",
    fallback: "Build the smallest useful version first.",
    multiline: true,
    rows: 2,
  },
];

export const TASK_FIELDS: Day3Field[] = [
  {
    section: "tasks",
    key: "landing_page",
    label: "Task 1 label",
    helper: "First action task checkbox.",
    fallback: "Create your challenge landing page",
  },
  {
    section: "tasks",
    key: "lead_magnet_quiz",
    label: "Task 2 label",
    helper: "Second action task checkbox.",
    fallback: "Add your lead magnet quiz",
  },
  {
    section: "tasks",
    key: "result_page",
    label: "Task 3 label",
    helper: "Third action task checkbox.",
    fallback: "Add your result page",
  },
  {
    section: "tasks",
    key: "day_content",
    label: "Task 4 label",
    helper: "Fourth action task checkbox.",
    fallback: "Create Day 1, Day 2, Day 3 content",
  },
  {
    section: "tasks",
    key: "invite_step",
    label: "Task 5 label",
    helper: "Fifth action task checkbox.",
    fallback: "Add a simple invite step",
  },
];

export const SCREEN_FIELDS: Day3Field[] = [
  {
    section: "ui",
    key: "complete_banner",
    label: "Completed banner — bold part",
    helper: "Shown at the top when Day 3 is already finished and read only.",
    fallback: "Day 3 is complete.",
  },
  {
    section: "ui",
    key: "complete_banner_body",
    label: "Completed banner — rest of line",
    helper: "The lighter text after the bold part.",
    fallback: "Your answers are saved.",
  },
  {
    section: "ui",
    key: "tasks_label",
    label: "Action tasks label",
    helper: "Small uppercase label above the task list.",
    fallback: "Action tasks",
  },
  {
    section: "ui",
    key: "tool_note_label",
    label: "Build note label",
    helper: "Small uppercase label on the build note card. Leave every build note field empty to hide the card.",
    fallback: "Build note",
  },
  {
    section: "ui",
    key: "tool_note_body",
    label: "Build note — first line",
    helper: "Keep this neutral. Do not name an outside product here.",
    fallback: "Build your challenge with whichever builder you already use.",
    multiline: true,
    rows: 2,
  },
  {
    section: "ui",
    key: "tool_note_secondary",
    label: "Build note — second line",
    helper: "Optional supporting line. Leave empty to hide it.",
    fallback: "A paid plan usually gives you more room to build and iterate.",
    multiline: true,
    rows: 2,
  },
  {
    section: "ui",
    key: "live_url_label",
    label: "Live URL field label",
    helper: "Label above the URL input.",
    fallback: "Paste your live URL",
  },
  {
    section: "ui",
    key: "live_url_placeholder",
    label: "Live URL placeholder",
    helper: "Grey example text inside the URL input.",
    fallback: "https://your-app.com",
  },
  {
    section: "ui",
    key: "live_url_error",
    label: "Live URL validation message",
    helper: "Shown when the pasted URL is not a valid https address.",
    fallback: "Please enter a valid URL starting with https://",
  },
  {
    section: "ui",
    key: "live_url_saved_label",
    label: "Saved live URL label",
    helper: "Label above the saved URL on the read only view.",
    fallback: "Your live URL",
  },
  {
    section: "ui",
    key: "cross_promo_title",
    label: "Other challenges spotlight title",
    helper: "Heading on the spotlight block at the bottom of Day 3.",
    fallback: "Other apps in progress",
  },
];

export const COPILOT_FIELDS: Day3Field[] = [
  {
    section: "copilot",
    key: "eyebrow",
    label: "Assistant eyebrow",
    helper: "Small uppercase line on the AI training card.",
    fallback: "Day 3 · AI-guided training",
  },
  {
    section: "copilot",
    key: "focus",
    label: "Assistant focus line",
    helper: "Bold focus sentence on the card.",
    fallback: "Design the challenge experience, momentum systems, and referral flow.",
    multiline: true,
    rows: 2,
  },
  {
    section: "copilot",
    key: "subtitle",
    label: "Assistant subtitle",
    helper: "Supporting line under the focus.",
    fallback: "Lock in the daily cadence, the unlock moments, and the reasons people invite others in.",
    multiline: true,
    rows: 2,
  },
  {
    section: "copilot",
    key: "starters",
    label: "Starter prompts",
    helper: "One suggested prompt per line.",
    fallback: [
      "Map a 3-day momentum arc that keeps people moving.",
      "Suggest 3 unlocks I can tie to participant referrals.",
      "Write a Day 3 invite message my audience will actually send.",
      "What's the smallest viable launch I can ship this week?",
    ].join("\n"),
    multiline: true,
    rows: 5,
  },
];

export const BUTTON_FIELDS: Day3Field[] = [
  {
    section: "buttons",
    key: "complete",
    label: "Complete Day 3 button",
    helper: "Green completion button under the tasks.",
    fallback: "Start Building Your Challenge",
  },
  {
    section: "buttons",
    key: "share_launch",
    label: "Share your launch button",
    helper: "On the celebration screen, inside the Builder Circle card.",
    fallback: "Share your launch",
  },
  {
    section: "buttons",
    key: "invite_builder",
    label: "Invite a builder button",
    helper: "On the celebration screen, inside the Builder Circle card.",
    fallback: "Invite a builder",
  },
  {
    section: "buttons",
    key: "unlock_circle",
    label: "Unlock Builder Circle button",
    helper: "Main button at the bottom of the Builder Circle card.",
    fallback: "Unlock Builder Circle",
  },
  {
    section: "buttons",
    key: "back_to_dashboard",
    label: "Back to dashboard button",
    helper: "Last button on the celebration screen.",
    fallback: "Back to Dashboard",
  },
];

export const CELEBRATION_FIELDS: Day3Field[] = [
  {
    section: "ui",
    key: "completion_note",
    label: "Completion note above the button",
    helper: "Sentence shown once every task and the live URL are done. Use {name} for the first name.",
    fallback: "You built a working challenge. That puts you ahead of most{name}.",
    multiline: true,
    rows: 2,
  },
  {
    section: "celebration",
    key: "title",
    label: "Celebration title",
    helper: "Big heading on the launch screen. Use {name} for the first name.",
    fallback: "You launched something real, {name}.",
    multiline: true,
    rows: 2,
  },
  {
    section: "celebration",
    key: "subtitle",
    label: "Celebration subtitle",
    helper: "Line under that heading.",
    fallback: "That puts you ahead of most.",
  },
  {
    section: "celebration",
    key: "live_title",
    label: "Live card — heading",
    helper: "Bold line in the highlighted card.",
    fallback: "Your challenge is now live.",
  },
  {
    section: "celebration",
    key: "live_body",
    label: "Live card — body",
    helper: "Line under that heading.",
    fallback: "It runs continuously and grows as people go through it and invite others.",
    multiline: true,
    rows: 2,
  },
  {
    section: "celebration",
    key: "circle_title",
    label: "Builder Circle card title",
    helper: "Heading beside the circle icon.",
    fallback: "Builder Circle",
  },
  {
    section: "celebration",
    key: "circle_lead",
    label: "Builder Circle lead line",
    helper: "Bold line under the title.",
    fallback: "You've built something real. Now get it seen.",
  },
  {
    section: "celebration",
    key: "circle_body",
    label: "Builder Circle body",
    helper: "Supporting line under the lead.",
    fallback: "Join a network where builders promote each other.",
    multiline: true,
    rows: 2,
  },
  {
    section: "celebration",
    key: "circle_progress",
    label: "Referral progress line",
    helper: "Small counter line. Use {count} for referrals so far and {target} for the number needed.",
    fallback: "{count} / {target} direct referrals",
  },
  {
    section: "celebration",
    key: "circle_helper",
    label: "Locked helper line",
    helper: "Shown under the button while Builder Circle is still locked.",
    fallback: "Submit your live URL and invite 3 builders to unlock.",
    multiline: true,
    rows: 2,
  },
];

export const TOAST_FIELDS: Day3Field[] = [
  {
    section: "toasts",
    key: "saved_title",
    label: "Answer saved toast — title",
    helper: "Appears when an answer is saved to the dashboard.",
    fallback: "Your dashboard is updated",
  },
  {
    section: "toasts",
    key: "saved_description",
    label: "Answer saved toast — description",
    helper: "Second line of that toast. Use {day} for the day number.",
    fallback: "Day {day} answer saved",
  },
  {
    section: "toasts",
    key: "saved_action",
    label: "Answer saved toast — action link",
    helper: "Link text on the same toast.",
    fallback: "Dashboard",
  },
  {
    section: "toasts",
    key: "shared",
    label: "Share toast",
    helper: "Shown after the share button is used.",
    fallback: "Thanks for spreading the word!",
  },
  {
    section: "toasts",
    key: "invited",
    label: "Invite toast",
    helper: "Shown after the invite button is used.",
    fallback: "Invite sent — one step closer to Builder Circle.",
  },
  {
    section: "toasts",
    key: "circle_unlocked",
    label: "Builder Circle unlocked toast",
    helper: "Shown when Builder Circle opens.",
    fallback: "Builder Circle unlocked! 🎉",
  },
];

export const DAY3_FIELDS: Day3Field[] = [
  ...HEADER_FIELDS,
  ...TRAINING_FIELDS,
  ...TASK_FIELDS,
  ...SCREEN_FIELDS,
  ...COPILOT_FIELDS,
  ...BUTTON_FIELDS,
  ...CELEBRATION_FIELDS,
  ...TOAST_FIELDS,
];

export const day3FieldId = (f: Day3Field): string => `${f.section}.${f.key}`;

const FALLBACKS: Record<string, string> = DAY3_FIELDS.reduce<Record<string, string>>(
  (acc, f) => {
    acc[day3FieldId(f)] = f.fallback;
    return acc;
  },
  {},
);

export const day3Fallback = (id: string): string => FALLBACKS[id] ?? "";

/** Replace {token} placeholders with real values. Unknown tokens are removed. */
export const fillTokens = (
  template: string,
  tokens: Record<string, string | number>,
): string =>
  template
    .replace(/\{([a-z_]+)\}/gi, (_m, raw: string) => {
      const v = tokens[String(raw)];
      return v === undefined || v === null ? "" : String(v);
    })
    .replace(/[ \t]{2,}/g, " ")
    .trim();

/** Split a multiline owner field into trimmed, non-empty lines. */
export const toLines = (value: string): string[] =>
  value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
