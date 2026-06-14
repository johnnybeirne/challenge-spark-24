## Goal

In the Day 2 quiz preview, the left "← Close" button should act as **Back** (return to the previous question), the right **X** should close the preview, and the whole quiz preview should open in a **new browser tab** instead of a modal.

## Current behaviour (audit)

- `src/components/Day2Screen1.tsx` opens the preview as a modal: `Day2QuizModal` (line 715), toggled by `setQuizModalOpen(true)` in `handleGenerateQuiz` (line 431-434).
- `src/components/Day2QuizModal.tsx` shows the generating screen, then `Day2QuizPlayable` inside a centered panel with its own X close button.
- `src/components/Day2QuizPlayable.tsx` `Shell` (lines 358-374) renders a single right-aligned "← Close" button that calls `onBack` and closes the modal.
- A standalone tab page already exists: `src/pages/QuizPreview.tsx` mounted at `/quiz-preview` (`src/App.tsx` line 224). It runs the same generating → playable flow and tries `window.close()` on back.

## Changes

### 1. `src/components/Day2Screen1.tsx` — open in a new tab
- Remove `Day2QuizModal` import, `quizModalOpen` state, and the `<Day2QuizModal …/>` render.
- In `handleGenerateQuiz`, call `window.open("/quiz-preview", "_blank", "noopener")` instead of opening the modal. Keep all surrounding logic (analytics, gating) untouched.

### 2. `src/components/Day2QuizPlayable.tsx` — split header into Back + Close
- Change `Shell` to render two header controls:
  - **Left:** `← Back` button → calls a new `onBack` handler (rename current prop to `onClose` for the X).
  - **Right:** circular `X` button → calls `onClose` (closes the tab).
- Update the component's props from `{ onBack }` to `{ onClose }` and add an internal back handler with this behaviour:
  - On **landing screen** (`!started`): Back is hidden (nothing to go back to) — only the X is shown.
  - On **question screen**: Back decrements `current` by 1 and pops the last answer; if already on question 1, it returns to the landing screen (`setStarted(false)`).
  - On **result screen**: Back returns to the final question (restore `current = questions.length - 1`, drop last answer).
- Wire `onClose` to whatever closes the surface (in the new-tab page that means `window.close()` fallback to `about:blank`).

### 3. `src/pages/QuizPreview.tsx` — pass `onClose`
- Replace the existing `onBack={handleClose}` with `onClose={handleClose}` to match the new prop name. No other logic changes; the generating phase and handoff stay the same.

### 4. `src/components/Day2QuizModal.tsx` — leave file in place
- No longer rendered anywhere after step 1. Leaving the file untouched avoids touching unrelated code; we can delete it in a follow-up if you'd like.

## Out of scope

- No changes to the generating screen visuals, audio, timing, or any analytics.
- No changes to routes other than how `/quiz-preview` is launched.
- No styling changes beyond adding the second header button.

## Files touched

- `src/components/Day2Screen1.tsx`
- `src/components/Day2QuizPlayable.tsx`
- `src/pages/QuizPreview.tsx`
