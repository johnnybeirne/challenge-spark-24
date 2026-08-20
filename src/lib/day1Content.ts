/**
 * Day 1 participant-facing copy — one shared source for the Challenger screen
 * (src/components/Day1Setup.tsx) and the owner editor (src/pages/AdminDay1.tsx).
 *
 * Every string lives in site_content on page "day1" as `section.key`.
 * The `fallback` below is the seed value: the editor writes it to the database
 * on first save, and the Challenger renders the database value when present.
 *
 * Nothing here is stored in localStorage.
 */

export type Day1Field = {
  section: string;
  key: string;
  label: string;
  helper: string;
  fallback: string;
  multiline?: boolean;
  rows?: number;
};

export const DAY1_PAGE = "day1";

export const CHALLENGE_TYPE_KEYS = [
  "solve_problem",
  "quick_win",
  "create_asset",
  "reach_milestone",
] as const;

export const HEADER_FIELDS: Day1Field[] = [
  {
    section: "header",
    key: "step_label",
    label: "Step header",
    helper: "Big heading at the very top. Use {step} and {total} for the numbers.",
    fallback: "Day 1 - Step {step} of {total}",
  },
];

export const OPTION_FIELDS: Day1Field[] = [
  {
    section: "options",
    key: "audience_b2b_label",
    label: "Audience option 1 — title",
    helper: "First card on the audience-type step.",
    fallback: "Business & Professionals",
  },
  {
    section: "options",
    key: "audience_b2b_description",
    label: "Audience option 1 — description",
    helper: "Line under the first audience card.",
    fallback: "Help businesses, teams, or experts get a result.",
  },
  {
    section: "options",
    key: "audience_b2b_short",
    label: "Audience option 1 — short name",
    helper: 'Used in the "You serve:" banner on the next step.',
    fallback: "Businesses / professionals",
  },
  {
    section: "options",
    key: "audience_b2c_label",
    label: "Audience option 2 — title",
    helper: "Second card on the audience-type step.",
    fallback: "Individuals & Consumers",
  },
  {
    section: "options",
    key: "audience_b2c_description",
    label: "Audience option 2 — description",
    helper: "Line under the second audience card.",
    fallback: "Help people improve an area of their life.",
  },
  {
    section: "options",
    key: "audience_b2c_short",
    label: "Audience option 2 — short name",
    helper: 'Used in the "You serve:" banner on the next step.',
    fallback: "Individuals / consumers",
  },
  {
    section: "options",
    key: "expert_types",
    label: "Expert type choices",
    helper: "One option per line. Shown as tick boxes on the expert-type step.",
    fallback: "Coach\nConsultant\nCourse creator\nTrainer\nSpeaker\nAuthor",
    multiline: true,
    rows: 7,
  },
  {
    section: "options",
    key: "challenge_solve_problem_title",
    label: "Challenge type 1 — title",
    helper: "Challenge-type card.",
    fallback: "Break Through a Blocker",
  },
  {
    section: "options",
    key: "challenge_solve_problem_description",
    label: "Challenge type 1 — description",
    helper: "Line under the card.",
    fallback: "Remove an obstacle preventing progress.",
  },
  {
    section: "options",
    key: "challenge_solve_problem_examples",
    label: "Challenge type 1 — examples",
    helper: "Comma separated.",
    fallback: "Fix a sales bottleneck, Overcome procrastination, Solve a technical issue",
  },
  {
    section: "options",
    key: "challenge_quick_win_title",
    label: "Challenge type 2 — title",
    helper: "Challenge-type card.",
    fallback: "Achieve a Quick Win",
  },
  {
    section: "options",
    key: "challenge_quick_win_description",
    label: "Challenge type 2 — description",
    helper: "Line under the card.",
    fallback: "Create a meaningful result quickly.",
  },
  {
    section: "options",
    key: "challenge_quick_win_examples",
    label: "Challenge type 2 — examples",
    helper: "Comma separated.",
    fallback: "Get first leads, Book meetings, Launch a landing page",
  },
  {
    section: "options",
    key: "challenge_create_asset_title",
    label: "Challenge type 3 — title",
    helper: "Challenge-type card.",
    fallback: "Build a Valuable Asset",
  },
  {
    section: "options",
    key: "challenge_create_asset_description",
    label: "Challenge type 3 — description",
    helper: "Line under the card.",
    fallback: "Create something that continues producing value.",
  },
  {
    section: "options",
    key: "challenge_create_asset_examples",
    label: "Challenge type 3 — examples",
    helper: "Comma separated.",
    fallback: "Website, AI assistant, Content system, Referral engine",
  },
  {
    section: "options",
    key: "challenge_reach_milestone_title",
    label: "Challenge type 4 — title",
    helper: "Challenge-type card.",
    fallback: "Advance a Major Goal",
  },
  {
    section: "options",
    key: "challenge_reach_milestone_description",
    label: "Challenge type 4 — description",
    helper: "Line under the card.",
    fallback: "Make measurable progress toward something important.",
  },
  {
    section: "options",
    key: "challenge_reach_milestone_examples",
    label: "Challenge type 4 — examples",
    helper: "Comma separated.",
    fallback: "Lose weight, Grow revenue, Publish a book, Change careers",
  },
];

export const STEP_FIELD_FIELDS: Day1Field[] = [
  {
    section: "fields",
    key: "audience_placeholder_b2b",
    label: "Who you serve — placeholder (business audience)",
    helper: "Grey text inside the box on the who-you-serve step.",
    fallback: "e.g. Independent coaches.",
  },
  {
    section: "fields",
    key: "audience_examples_b2b",
    label: "Who you serve — examples (business audience)",
    helper: "One bullet per line, shown under the box.",
    fallback: "Independent coaches\nService-based agency owners\nEarly-stage SaaS founders",
    multiline: true,
    rows: 4,
  },
  {
    section: "fields",
    key: "audience_placeholder_b2c",
    label: "Who you serve — placeholder (consumer audience)",
    helper: "Grey text inside the box on the who-you-serve step.",
    fallback: "e.g. New parents in their 30s.",
  },
  {
    section: "fields",
    key: "audience_examples_b2c",
    label: "Who you serve — examples (consumer audience)",
    helper: "One bullet per line, shown under the box.",
    fallback:
      "New parents in their 30s\nWomen returning to work after a career break\nFirst-time homebuyers",
    multiline: true,
    rows: 4,
  },
  {
    section: "fields",
    key: "superpower_placeholder",
    label: "Superpower — placeholder",
    helper: "Grey text inside the box on the superpower step.",
    fallback:
      "e.g. I make complex ideas feel simple and actionable, so people finally take the step they've been avoiding.",
    multiline: true,
    rows: 3,
  },
  {
    section: "fields",
    key: "superpower_examples",
    label: "Superpower — examples",
    helper: "One bullet per line, shown under the box.",
    fallback:
      "Turning messy ideas into a clear step-by-step plan people can actually follow.\nSpotting the one bottleneck that's quietly holding someone's business back.\nHelping nervous beginners take action without overthinking it.",
    multiline: true,
    rows: 4,
  },
  {
    section: "fields",
    key: "problem_placeholder",
    label: "Problem — placeholder",
    helper: "Grey text inside the box on the problem step.",
    fallback: "Describe the single most painful problem they have right now…",
    multiline: true,
    rows: 2,
  },
  {
    section: "fields",
    key: "process_placeholder",
    label: "Process — placeholder",
    helper: "Grey text inside the box on the process step.",
    fallback:
      "e.g. Describe the steps or framework you take them through to create the result.",
    multiline: true,
    rows: 3,
  },
  {
    section: "fields",
    key: "process_examples",
    label: "Process — examples",
    helper: "One bullet per line, shown under the box.",
    fallback:
      "I start with a quick audit, then walk them through a simple 3-step framework.\nI give them one focused daily action and review their progress each day.\nI hand them a fill-in-the-blank template and coach them to adapt it to their situation.",
    multiline: true,
    rows: 4,
  },
  {
    section: "fields",
    key: "outcome_placeholder",
    label: "Result — placeholder",
    helper: "Grey text inside the box on the final answer step.",
    fallback: "e.g. The transformation they will experience by the end of the 3 days.",
    multiline: true,
    rows: 3,
  },
  {
    section: "fields",
    key: "outcome_examples",
    label: "Result — examples",
    helper: "One bullet per line, shown under the box.",
    fallback:
      "A one-line pitch they're confident saying out loud to any prospect.\nA simple lead-gen system bringing in 3–5 qualified conversations a week.\nTheir first paying client booked and onboarded by the end of Day 3.",
    multiline: true,
    rows: 4,
  },
];

export const SCREEN_FIELDS: Day1Field[] = [
  {
    section: "ui",
    key: "serve_prefix",
    label: "Audience banner prefix",
    helper: 'Text before the chosen audience type, e.g. "You serve: ".',
    fallback: "You serve: ",
  },
  {
    section: "ui",
    key: "recap_audience",
    label: "Recap label — who you work with",
    helper: "Row label in the running recap card.",
    fallback: "You work with:",
  },
  {
    section: "ui",
    key: "recap_expert",
    label: "Recap label — expert type",
    helper: "Row label in the recap card. Use {article} for a or an.",
    fallback: "You are {article}:",
  },
  {
    section: "ui",
    key: "recap_superpower",
    label: "Recap label — superpower",
    helper: "Row label in the recap card.",
    fallback: "Your superpower:",
  },
  {
    section: "ui",
    key: "recap_goal",
    label: "Recap label — goal",
    helper: "Row label in the recap card.",
    fallback: "Your goal:",
  },
  {
    section: "ui",
    key: "recap_problem",
    label: "Recap label — problem",
    helper: "Row label in the recap card.",
    fallback: "The problem:",
  },
  {
    section: "ui",
    key: "recap_process",
    label: "Recap label — process",
    helper: "Row label in the recap card.",
    fallback: "Your process:",
  },
  {
    section: "ui",
    key: "recap_outcome",
    label: "Recap label — result",
    helper: "Row label in the recap card.",
    fallback: "The result:",
  },
  {
    section: "ui",
    key: "saving_note",
    label: "Saving note",
    helper: "Small grey line telling the participant answers are being saved.",
    fallback: "Note: I am saving these to your Dashboard",
  },
  {
    section: "ui",
    key: "superpower_question",
    label: "Superpower question",
    helper: "Coach line on the superpower step. Use {name} for the comma plus first name.",
    fallback: "Great{name}, what's your superpower when it comes to helping them?",
  },
  {
    section: "ui",
    key: "ack_process",
    label: "Acknowledgement before the process question",
    helper: "Short coach line. Use {name} for the comma plus first name.",
    fallback: "That's clear{name}.",
  },
  {
    section: "ui",
    key: "ack_outcome",
    label: "Acknowledgement before the result question",
    helper: "Short coach line. Use {name} for the comma plus first name.",
    fallback: "Got it{name}.",
  },
  {
    section: "ui",
    key: "summary_who",
    label: "Summary line — audience",
    helper: "Review step. Use {value} for the participant's own words.",
    fallback: "You're building this challenge for {value}.",
  },
  {
    section: "ui",
    key: "summary_problem",
    label: "Summary line — problem",
    helper: "Review step. Use {value} for the participant's own words.",
    fallback: "Right now, they're stuck because {value}.",
  },
  {
    section: "ui",
    key: "summary_result",
    label: "Summary line — result",
    helper: "Review step. Use {value} for the participant's own words.",
    fallback: "By the end of Day 3, they'll have {value}.",
  },
  {
    section: "ui",
    key: "summary_guide_by",
    label: "Summary line — process",
    helper: "Review step, used when the participant described their process. Use {value}.",
    fallback: "You'll guide them by {value}.",
  },
  {
    section: "ui",
    key: "summary_guide_through",
    label: "Summary line — process fallback",
    helper: "Review step, used when no process was written. Use {value}.",
    fallback: "You'll guide them through {value} to help them achieve that result.",
  },
  {
    section: "ui",
    key: "summary_closing",
    label: "Summary closing line",
    helper: "Last line of the review summary.",
    fallback:
      "That's what makes this challenge valuable. A clear path from where they are today to the exact result you've described.",
    multiline: true,
    rows: 2,
  },
  {
    section: "ui",
    key: "promise_heading",
    label: "Promise card heading",
    helper: "Small label above the challenge promise.",
    fallback: "Challenge Promise",
  },
  {
    section: "ui",
    key: "promise_from",
    label: "Promise label — part 1",
    helper: "Label above the first part of the promise.",
    fallback: "FROM",
  },
  {
    section: "ui",
    key: "promise_to",
    label: "Promise label — part 2",
    helper: "Label above the second part of the promise.",
    fallback: "TO",
  },
  {
    section: "ui",
    key: "promise_so_that",
    label: "Promise label — part 3",
    helper: "Label above the third part of the promise.",
    fallback: "SO THAT",
  },
  {
    section: "ui",
    key: "promise_and_stop",
    label: "Promise label — part 4",
    helper: "Label above the fourth part of the promise.",
    fallback: "AND STOP",
  },
  {
    section: "ui",
    key: "starting_point_heading",
    label: "Starting point heading",
    helper: "Heading on the final Day 1 screen.",
    fallback: "Your Starting Point",
  },
  {
    section: "ui",
    key: "starting_point_problem",
    label: "Starting point label — problem",
    helper: "Row label in the starting point snapshot.",
    fallback: "Problem:",
  },
  {
    section: "ui",
    key: "starting_point_for",
    label: "Starting point label — audience",
    helper: "Row label in the starting point snapshot.",
    fallback: "For:",
  },
  {
    section: "ui",
    key: "starting_point_how",
    label: "Starting point label — process",
    helper: "Row label in the starting point snapshot.",
    fallback: "How:",
  },
  {
    section: "ui",
    key: "assistant_note",
    label: "Assistant note",
    helper: "Small line under the finish button.",
    fallback: "You can get help from Johnny AI anytime.",
  },
  {
    section: "ui",
    key: "reset_note",
    label: "Reset note",
    helper: "Small line under the restart link while restarting is still allowed.",
    fallback:
      "If you need to start over, you can reset Day 1 within 24 hours of starting. Use this only if you want to change your answers.",
    multiline: true,
    rows: 2,
  },
  {
    section: "ui",
    key: "locked_note",
    label: "Locked note",
    helper: "Shown in place of the restart link when Day 1 answers are locked.",
    fallback:
      "Your Challenge Promise is now locked. To change your answers, upgrade to Lifetime Challenge Access.",
    multiline: true,
    rows: 2,
  },
  {
    section: "ui",
    key: "reset_dialog_title",
    label: "Restart dialog title",
    helper: "Heading of the confirm dialog.",
    fallback: "WARNING. Are you sure?",
  },
  {
    section: "ui",
    key: "reset_dialog_body",
    label: "Restart dialog body",
    helper: "Body of the confirm dialog.",
    fallback:
      "This clears your Day 1 answers, AI outputs, and progress so you can start the questions from scratch. Your referrals, points, and other progress are kept.",
    multiline: true,
    rows: 3,
  },
];

export const BUTTON_FIELDS: Day1Field[] = [
  { section: "buttons", key: "back", label: "Back link", helper: "Top-left link that steps back one question.", fallback: "Back" },
  { section: "buttons", key: "continue", label: "Continue button", helper: "The main button on every question step.", fallback: "Continue" },
  { section: "buttons", key: "thinking", label: "Continue button — busy after the problem", helper: "Shown while the coach reads the problem answer.", fallback: "Thinking…" },
  { section: "buttons", key: "crafting", label: "Continue button — busy after the result", helper: "Shown while the promise is being written.", fallback: "Crafting your promise…" },
  { section: "buttons", key: "continue_building", label: "Review step button", helper: "Button under the challenge promise.", fallback: "Continue Building Your Challenge" },
  { section: "buttons", key: "restart", label: "Restart link", helper: "Link and confirm button that restarts Day 1.", fallback: "Start Day 1 again" },
  { section: "buttons", key: "restart_cancel", label: "Restart dialog cancel", helper: "Cancel button in the restart dialog.", fallback: "Cancel" },
  { section: "buttons", key: "complete_day1", label: "Finish Day 1 button", helper: "Final button on the Day 1 screen.", fallback: "Complete Day 1 & Unlock Day 2" },
];

export const TOAST_FIELDS: Day1Field[] = [
  { section: "toasts", key: "saved_title", label: "Saved toast title", helper: "Confirmation shown each time an answer is saved.", fallback: "Your dashboard is updated" },
  { section: "toasts", key: "saved_action", label: "Saved toast link", helper: "Link inside the confirmation toast.", fallback: "Dashboard" },
  { section: "toasts", key: "saved_audience_b2b", label: "Saved — business audience", helper: "Toast detail line.", fallback: "Audience: businesses" },
  { section: "toasts", key: "saved_audience_b2c", label: "Saved — consumer audience", helper: "Toast detail line.", fallback: "Audience: consumers" },
  { section: "toasts", key: "saved_audience", label: "Saved — who you serve", helper: "Toast detail line.", fallback: "Who you serve" },
  { section: "toasts", key: "saved_expert", label: "Saved — expert types", helper: "Toast detail line.", fallback: "Your expert types" },
  { section: "toasts", key: "saved_superpower", label: "Saved — superpower", helper: "Toast detail line.", fallback: "Your superpower" },
  { section: "toasts", key: "saved_problem", label: "Saved — problem", helper: "Toast detail line.", fallback: "The problem you're solving" },
  { section: "toasts", key: "saved_process", label: "Saved — process", helper: "Toast detail line.", fallback: "How you create the result" },
  { section: "toasts", key: "saved_outcome", label: "Saved — result", helper: "Toast detail line.", fallback: "The outcome you'll deliver" },
  { section: "toasts", key: "saved_goal", label: "Saved — goal", helper: "Toast detail line.", fallback: "Your goal" },
  { section: "toasts", key: "saved_result", label: "Saved — result choice", helper: "Toast detail line.", fallback: "Result saved" },
  { section: "toasts", key: "saved_trigger", label: "Saved — trigger moment", helper: "Toast detail line.", fallback: "Trigger moment saved" },
  { section: "toasts", key: "saved_direction", label: "Saved — challenge direction", helper: "Toast detail line on the review step.", fallback: "Challenge direction confirmed" },
  { section: "toasts", key: "saved_challenge_type", label: "Saved — challenge type", helper: "Toast detail line. Use {label} for the chosen type.", fallback: "Challenge type: {label}" },
  { section: "toasts", key: "reset", label: "Restart toast", helper: "Shown after Day 1 is reset.", fallback: "Day 1 reset. Let's start again." },
  { section: "toasts", key: "notification_title", label: "Dashboard notification title", helper: "Notification pushed to the bell menu.", fallback: "Dashboard updated" },
  { section: "toasts", key: "notification_body", label: "Dashboard notification body", helper: "Body of that notification.", fallback: "Your dashboard now reflects your latest challenge answers.", multiline: true, rows: 2 },
];

export const VIDEO_FIELDS: Day1Field[] = [
  { section: "video", key: "title", label: "Video modal title", helper: "Heading of the Day 1 welcome video pop-up.", fallback: "Welcome to Day 1 — Define Your Challenge" },
  { section: "video", key: "subtitle", label: "Video modal subtitle", helper: "Line under that heading.", fallback: "Watch this short briefing before you begin." },
];

export const DAY1_FIELDS: Day1Field[] = [
  ...HEADER_FIELDS,
  ...OPTION_FIELDS,
  ...STEP_FIELD_FIELDS,
  ...SCREEN_FIELDS,
  ...BUTTON_FIELDS,
  ...TOAST_FIELDS,
  ...VIDEO_FIELDS,
];

export const day1FieldId = (f: Day1Field): string => `${f.section}.${f.key}`;

const FALLBACKS: Record<string, string> = DAY1_FIELDS.reduce<Record<string, string>>(
  (acc, f) => {
    acc[day1FieldId(f)] = f.fallback;
    return acc;
  },
  {},
);

export const day1Fallback = (id: string): string => FALLBACKS[id] ?? "";

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
