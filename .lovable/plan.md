# Quiz UI Redesign — Bold Editorial

Pure visual refresh of the question screen at `/assessment`. Same 9 questions, same scoring, same admin editor (`/admin/lead-gen-quiz`), same results flow.

## Scope (what changes)

Only the question-rendering block inside `src/pages/Assessment.tsx`:
- Centered 640px column.
- White card with `rounded-[40px]`, hairline border `#E2E8F0`, soft shadow.
- Avatar centered at top, larger (80px), inside a hairline ring.
- "JOHNNY B AI" label rendered in accent blue, wide tracking, small caps.
- Question text centered, **Fraunces serif, italic, semibold**, ~text-3xl/4xl.
- Two answer buttons **stacked full-width** (not side by side), large hairline rounded-2xl, hover border → accent blue.
- Back link sits above the card, left-aligned.
- Progress dots below the card — active dot becomes a short capsule.
- Accent color: `#2563EB` (mapped to existing `--primary` token, not hardcoded).

## Out of scope (do not touch)

- `Landing.tsx` (start screen) — unchanged.
- Loading screen between last answer and `/results` — unchanged.
- `useQuizQuestions`, `questions`, `generateResult`, `assessmentData.ts` — unchanged.
- `AdminLeadGenQuiz.tsx` — unchanged.
- Routing, scoring, analytics events, memory writes — unchanged.
- All other pages.

## Technical details

1. **Font**: install Fraunces via `@fontsource/fraunces` (weights 400, 600; italic 400) and import in `src/main.tsx`. Add `fraunces` to `tailwind.config.ts` `fontFamily`. Inter is already loaded.
2. **Tokens**: use existing semantic tokens where they match (`bg-background`, `text-foreground`, `border-border`, `text-primary`, `bg-card`). Avoid raw hex in JSX per design system rule.
3. **Markup change**: replace the `<div key={q.id} ...>` block (the avatar + question + 2-button grid + dot progress) with the new composition. Keep the same React state (`current`, `answers`, `handleAnswer`, `questions`) — only JSX/classes change.
4. **Buttons**: keep `q.options.map(...)` so admin-edited Yes/No labels still flow through. Change `grid-cols-2` → `grid-cols-1` (stacked) and restyle.
5. **Progress dots**: keep `questions.map((_, i) => ...)` — restyle so the active dot is a wider capsule and others are small dots.
6. **Back button**: keep current behavior (`current > 0 ? setCurrent(current-1) : setStarted(false)`), restyle to match the new icon + label style.
7. **SEO, mode resolution, referral capture, partner tracking, typewriter, loading screen**: untouched.

## Conflicts / risks

None I can see. Admin editing keeps working because we still render `q.text` and `q.options[].label`. Scoring is purely off `answers` map keyed by `q.id`. No DB or analytics shape changes.

## Files

- `src/pages/Assessment.tsx` — JSX swap inside the active-question return.
- `src/main.tsx` — add `@fontsource/fraunces` imports.
- `tailwind.config.ts` — add `fraunces` font family.
- `package.json` (via `bun add @fontsource/fraunces`).

## Verification

Manually load `/assessment`, click start, confirm: card layout matches direction, Fraunces renders, hover state goes blue, dots advance, all 9 questions complete, loading screen shows, `/results` renders normally.
