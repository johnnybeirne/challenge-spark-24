## Goal

Make the quiz preview modal (used by both Marcus and Sophie) look and feel like the `/assessment` page across every screen — landing, question, and result.

## Scope

Only one file: `src/components/Day2QuizPlayable.tsx`. The SampleQuizBanner, all logic, state, scoring, audio (none), `onClose`, and tracking events stay exactly as-is.

## What changes

### 1. Shared frame (all screens)

Wrap landing, loading, question, and result in a single Assessment-style frame:

- Outer: `relative min-h-full w-full flex items-center justify-center p-4 overflow-hidden`
- Blurred background image layer: `absolute inset-0 bg-cover bg-center scale-105` with `backgroundImage: url(assessmentBg.url)` and `filter: blur(4px)` — imported from `@/assets/assessment-bg.png.asset.json`
- Dark overlay layer: `absolute inset-0 bg-foreground/20`
- SampleQuizBanner stays sticky at the very top above the frame
- Card container: `relative w-full max-w-[420px] flex flex-col items-center`

This gives every screen the same blurred-app backdrop + vertically centered card that Assessment uses.

### 2. Landing screen

Replace the current purple gradient hero + standalone card with the Assessment-style intro card:

- Single rounded card: `relative w-full bg-card border border-border rounded-[40px] p-8 md:p-14 shadow-[0_20px_50px_hsl(var(--foreground)/0.04)] animate-fade-in`
- Eyebrow (uppercase tracked): `quiz.quizTitle`
- Headline (font-montserrat font-semibold text-xl md:text-2xl, centered): the `headline` variable
- Subhead (text-sm text-muted-foreground, centered): the `sub` variable
- Feature pills row (questions count / Under 2 minutes / Instant result) — kept
- CTA button (`w-full h-14 rounded-full font-bold shadow-lg`): Take the Quiz
- Footnote: Personalised result in seconds

The purple gradient hero card and the second small "JOHNNY B AI" header are removed — Assessment doesn't have either.

### 3. Question screen

Already close to Assessment. Adjustments:

- Drop the outer `bg-background` wrapper; render inside the shared blurred frame instead so the card floats over the backdrop like Assessment does
- Card classes unchanged (`rounded-[40px] p-8 md:p-14 …`)
- Back button, typewriter question, single-column answer buttons with `CheckCircle2`, progress dots — all unchanged

### 4. Result screen

Currently a trophy + 3-tier breakdown laid out on plain `bg-background`. Restyle to Assessment's card pattern:

- Same shared blurred frame and centered `max-w-[420px]` column
- Single rounded card (`rounded-[40px] p-8 md:p-14 …`) replacing the current `rounded-3xl` gradient card
- Inside the card, top → bottom:
  - Eyebrow: "Your result"
  - Trophy chip
  - Tier name as `font-montserrat font-semibold text-2xl md:text-3xl` headline
  - Tier description as muted body copy
  - 3-tier count grid (kept — useful info)
  - Try again / Share result buttons inside the card, stacked on mobile / row on sm+
  - Footnote: "This is exactly what {audience} will see after taking your quiz."

All existing handlers (`reset`, `navigator.share`, `toast.success`) preserved.

### 5. Loading screen

Already uses Assessment's avatar + sonar rings + typewriter. Move it inside the shared blurred frame so it matches the same surface.

## Technical notes

- New import: `import assessmentBg from "@/assets/assessment-bg.png.asset.json"`
- `aiAvatar` import stays (loading screen)
- No changes to `applyCharacter`, persona overrides, `readDay1Values`, scoring, or quiz fetch logic
- No changes to `Day2QuizModal.tsx` — the modal already provides the rounded panel + close button; the blurred backdrop renders inside `Day2QuizPlayable`'s own frame
- Pure visual/layout change; no new dependencies

## Out of scope

- Quiz logic, scoring, persona data
- Modal chrome, close button, sticky SampleQuizBanner styling
- Any other file
