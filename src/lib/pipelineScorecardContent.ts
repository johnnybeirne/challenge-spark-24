/**
 * Pipeline Scorecard — owner-editable copy.
 *
 * Two site_content pages:
 *  - "pipeline_scorecard_landing": the standalone landing page at /pipeline-scorecard
 *    (rows seeded in the earlier migration — this file only exposes them).
 *  - "pipeline_scorecard_result": the bridge section on /pipeline-scorecard/result
 *    (written on first save from the admin editor).
 *
 * Tier names/subtitles/descriptions and the questions stay hardcoded in
 * src/pages/PipelineScorecardResult.tsx / PipelineScorecardQuiz.tsx.
 */

export const SCORECARD_LANDING_PAGE = "pipeline_scorecard_landing";
export const SCORECARD_RESULT_PAGE = "pipeline_scorecard_result";

export interface ScorecardField {
  page: string;
  section: string;
  key: string;
  label: string;
  helper?: string;
  fallback: string;
  multiline?: boolean;
  rows?: number;
}

export const scorecardFieldId = (f: ScorecardField) => `${f.section}.${f.key}`;

export const LANDING_FIELDS: ScorecardField[] = [
  {
    page: SCORECARD_LANDING_PAGE,
    section: "hero",
    key: "eyebrow",
    label: "Eyebrow",
    helper: "The small line above the headline.",
    fallback: "Nine quick questions",
  },
  {
    page: SCORECARD_LANDING_PAGE,
    section: "hero",
    key: "headline",
    label: "Headline",
    fallback: "The Client Acquisition & Pipeline Leverage Scorecard",
  },
  {
    page: SCORECARD_LANDING_PAGE,
    section: "hero",
    key: "subhead",
    label: "Subheading",
    helper: "One sentence framing it as a quick assessment of their pipeline bottleneck.",
    fallback:
      "A short assessment that pinpoints the single biggest bottleneck slowing the growth of your pipeline right now.",
    multiline: true,
    rows: 3,
  },
  {
    page: SCORECARD_LANDING_PAGE,
    section: "hero",
    key: "cta_label",
    label: "Button label",
    fallback: "Start the scorecard",
  },
  {
    page: SCORECARD_LANDING_PAGE,
    section: "hero",
    key: "image",
    label: "Image URL",
    helper: "Shown on the right of the landing page. Leave empty to show the placeholder slot.",
    fallback: "",
  },
  {
    page: SCORECARD_LANDING_PAGE,
    section: "hero",
    key: "image_alt",
    label: "Image alt text",
    fallback: "Scorecard illustration",
  },
];

export const RESULT_FIELDS: ScorecardField[] = [
  {
    page: SCORECARD_RESULT_PAGE,
    section: "bridge",
    key: "headline",
    label: "Bridge headline",
    helper: "The line above the button that hands the visitor over to the challenge.",
    fallback: "Ready to build the system your scorecard points to?",
  },
  {
    page: SCORECARD_RESULT_PAGE,
    section: "bridge",
    key: "body",
    label: "Bridge body",
    helper: "The smaller line under the button.",
    fallback: "The 3-Day Challenge builds the exact evergreen system your scorecard points to.",
    multiline: true,
    rows: 2,
  },
  {
    page: SCORECARD_RESULT_PAGE,
    section: "bridge",
    key: "cta_label",
    label: "Bridge button label",
    fallback: "Join the 3-Day Challenge",
  },
  {
    page: SCORECARD_RESULT_PAGE,
    section: "bridge",
    key: "cta_route",
    label: "Bridge button destination",
    helper: "The in-app route the button opens. Default is the challenge signup page.",
    fallback: "/challenge/join",
  },
];

export const SCORECARD_FIELDS: ScorecardField[] = [...LANDING_FIELDS, ...RESULT_FIELDS];
