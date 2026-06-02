import type { AppState } from "@/context/AppContext";

const SAMPLE_CHALLENGE_NAME = "Consistent Leads Challenge";
const SAMPLE_DAY1_SETUP = {
  completed: true,
  audienceType: "b2b" as const,
  challengeType: "solve-problem",
  topicHint: "consistent lead generation",
  desiredOutcome: "create a simple lead system they can keep using",
  problem: "their growth depends on constant outreach and posting",
  audience: "coaches and consultants who want more qualified leads",
  how: "a focused 3-day diagnostic that shows where their current lead flow is leaking",
  outcome: "create a simple lead system they can keep using",
  superpower: "turning expertise into clear diagnostics",
};

const SAMPLE_DAY1_PROMISE =
  "Help coaches and consultants move from inconsistent outreach to a simple lead system they can keep using through a focused 3-day diagnostic.";

const SAMPLE_OUTPUTS_BY_DAY: Record<1 | 2 | 3, Record<string, string>> = {
  1: {
    day1_define_app: SAMPLE_DAY1_SETUP.audience,
    day1_problem: SAMPLE_DAY1_SETUP.problem,
    day1_result: SAMPLE_DAY1_SETUP.outcome,
    day1_share_reason: "It helps friends quickly spot the same lead-generation gaps in their own business.",
    day1Setup: JSON.stringify(SAMPLE_DAY1_SETUP),
    day1_foundation: JSON.stringify({
      problem: SAMPLE_DAY1_SETUP.problem,
      audience: SAMPLE_DAY1_SETUP.audience,
      how: SAMPLE_DAY1_SETUP.how,
    }),
    day1_assessment: JSON.stringify({
      problem: SAMPLE_DAY1_SETUP.problem,
      audience: SAMPLE_DAY1_SETUP.audience,
      how: SAMPLE_DAY1_SETUP.how,
      audienceType: SAMPLE_DAY1_SETUP.audienceType,
      challengeType: SAMPLE_DAY1_SETUP.challengeType,
      transformation: SAMPLE_DAY1_SETUP.topicHint,
    }),
    day1_promise: JSON.stringify({
      summary: [
        `Audience: ${SAMPLE_DAY1_SETUP.audience}`,
        `Problem: ${SAMPLE_DAY1_SETUP.problem}`,
        `Outcome: ${SAMPLE_DAY1_SETUP.outcome}`,
      ],
      promise: SAMPLE_DAY1_PROMISE,
    }),
    day1_title: SAMPLE_CHALLENGE_NAME,
    day1_transformation: "Turn inconsistent promotion into a repeatable lead-generation habit.",
    day1_quick_win: "Spot the biggest leak in their current lead flow.",
    day1_outcome: SAMPLE_DAY1_SETUP.outcome,
    day1_structure: "Day 1: diagnose the leak. Day 2: build the quiz. Day 3: launch the invite loop.",
  },
  2: {
    day2_quiz_questions:
      "1. Do you have a clear ideal client?\n2. Do you know your top lead source?\n3. Do you have a repeatable follow-up?\n4. Do you track conversion rates?\n5. Do you have a referral system?",
  },
  3: {},
};

const TASKS_BY_DAY: Record<1 | 2 | 3, string[]> = {
  1: ["day1_define_app", "day1_problem", "day1_result", "day1_share_reason"],
  2: ["day2_quiz_questions"],
  3: ["day3_landing_page", "day3_lead_magnet_quiz", "day3_result_page", "day3_day_content", "day3_invite_step"],
};

const seedIfEmpty = (outputs: Record<string, string>, seed: Record<string, string>) => {
  Object.entries(seed).forEach(([key, value]) => {
    if (!outputs[key]?.trim()) outputs[key] = value;
  });
};

export const seedCompletedDayData = (state: AppState, completedThroughDay: number) => {
  const tasks = { ...state.challenge.tasks };
  const aiOutputs = { ...state.challenge.aiOutputs };

  ([1, 2, 3] as const).forEach((day) => {
    if (completedThroughDay < day) return;
    TASKS_BY_DAY[day].forEach((key) => {
      tasks[key] = true;
    });
    seedIfEmpty(aiOutputs, SAMPLE_OUTPUTS_BY_DAY[day]);
  });

  const memory =
    completedThroughDay >= 1
      ? {
          ...state.memory,
          name: state.memory.name || state.user?.name || "Persona Preview",
          audienceType: state.memory.audienceType || "b2b",
          challengeType: state.memory.challengeType || "transformation",
          topic: state.memory.topic || SAMPLE_DAY1_SETUP.audience,
          desiredOutcome: state.memory.desiredOutcome || SAMPLE_DAY1_SETUP.outcome,
          challengeName: state.memory.challengeName || SAMPLE_CHALLENGE_NAME,
        }
      : state.memory;

  return { tasks, aiOutputs, memory };
};