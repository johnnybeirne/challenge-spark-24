## Plan — Microphone dictation on all free-form fields

We already have `useDictation` (Web Speech API) and a `DictateButton` UI used in `Day1Setup`. Roll the same pattern out to every user-facing free-form input/textarea, skipping name and email fields and skipping admin/CMS authoring screens.

### What gets dictation

User-facing free-form fields:
- `src/pages/blueprint/BlueprintInsight.tsx` — Problem, Audience, Result textareas (the screenshot)
- `src/pages/DayChallenge.tsx` — all task inputs + textareas (Day 1 setup questions, Day 2 quiz questions, etc.)
- `src/pages/Mentor.tsx` — Ask-the-mentor textarea
- `src/pages/Dashboard.tsx` — feedback/notes textarea
- `src/pages/Partners.tsx` — application "tell us about yourself" textarea
- `src/components/AiCopilotChat.tsx` — chat composer textarea
- `src/components/auth/SignupChat.tsx` — only the free-form prompts (skip name + email steps)

Explicitly excluded:
- Name, email, password, URL, coupon, referral-code fields
- Admin/CMS authoring (`AdminContent`, `AdminTraining`, `AdminChallengeDays`, `AdminDiagnosticResponses`, `cms-ui`, `CmsCopilot`)

### How

1. Create two small wrapper components that keep current styling and add a mic button inside the field:
   - `src/components/dictation/DictatedTextarea.tsx` — wraps shadcn `Textarea`, mic pinned bottom-right, adds right padding so text doesn't run under the button.
   - `src/components/dictation/DictatedInput.tsx` — wraps shadcn `Input`, mic pinned right, same right padding treatment.
   Both accept the same props as the underlying control plus `value` + `onChange` so they can drive controlled state. Internally they call `useDictation()` and on each transcript update call `onChange` with the merged text (existing value + dictated text appended on first start, then live-replaced while listening).

2. Reuse the existing `DictateButton` styling, but allow size/position variants so it works on single-line inputs and multi-line textareas without overlapping content.

3. Swap the listed `Textarea`/`Input` usages to the new wrappers. No behavior changes beyond adding the mic. Names, emails, and admin authoring fields stay as plain shadcn controls.

4. Graceful fallback: when `isSupported` is false (e.g., Firefox), the wrappers render the plain control with no mic button — no UI clutter, no errors.

### Files expected to change

- New: `src/components/dictation/DictatedTextarea.tsx`, `src/components/dictation/DictatedInput.tsx`
- Edit: `src/components/DictateButton.tsx` (add position variant), `BlueprintInsight.tsx`, `DayChallenge.tsx`, `Mentor.tsx`, `Dashboard.tsx`, `Partners.tsx`, `AiCopilotChat.tsx`

### Out of scope

- Server-side transcription (ElevenLabs Scribe). Browser Web Speech API is already wired and free; no new secrets or edge functions needed. We can upgrade to Scribe later if you want cross-browser parity on Firefox.