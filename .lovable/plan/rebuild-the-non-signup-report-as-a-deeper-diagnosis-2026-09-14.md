# Rebuild the non-signup report as a deeper diagnosis

## What will change

- Rework the shared report body used by both `/r/:token` and `/report`.
- Remove the repeated score ring, percentage breakdown rows, and repeated overall diagnosis from these two report pages only.
- Open with the lead's first name and an editable “let’s go deeper” line.
- Show the existing owner-editable archetype name and tagline prominently.
- Follow with 2–3 new blocker insights selected from the lead's category results, without displaying their percentages again.
- Leave the existing 3-Day Challenge teaser and join section unchanged.
- Do not alter the main quiz results page, participant shell, report token/email flow, or report error handling.

## Deeper insight selection

- Recalculate System, Audience, and Conversion from the assessment answers already stored in each report.
- Rank valid categories from weakest to strongest.
- Show every category below the high band, with a minimum of the two weakest and a maximum of three.
- Select each insight from the combination of the lead's archetype tier and category, so the same category can be framed differently for a Pioneer, Architect, or Authority.
- If older report data lacks category answers, use the overall archetype tier and safe fallback insight copy rather than showing an empty section.

## Admin editor

Add a new “Deeper diagnosis” card near the top of `Results Page Editor - Non-signup`, using its existing Save and Preview controls.

New editable fields:
- Personalised opening line, supporting `{name}`
- Deeper-insight section heading
- Pioneer: System, Audience, Conversion blocker copy
- Architect: System, Audience, Conversion blocker copy
- Authority: System, Audience, Conversion blocker copy

The existing teaser, closing, button, and unavailable-report fields remain unchanged and continue saving to the same `results / report_page` content area.

## Verification

- Check `/r/sample` and `/report` at desktop and mobile widths.
- Confirm the opening uses the first name, the archetype appears, and 2–3 tailored insights appear without score percentages or progress bars.
- Confirm the teaser wording and join CTA remain unchanged.
- Confirm the admin editor loads, previews, and saves both old and new fields without affecting the original Results Page Editor.
