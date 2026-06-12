## Goal

Insert a full-screen, personalised "AI is building your quiz" animation between clicking **Generate your quiz now** on Day 2 Step 1 and the playable quiz preview on Step 2.

## Flow

```
Step 1 of 5 ──[click Generate]──▶ Generating overlay ──[fade]──▶ Step 2 of 5 (playable)
```

The overlay runs the API call *and* a personalised status sequence in parallel, then waits for both before revealing Step 2.

## Files

**New** — `src/components/Day2QuizGenerating.tsx`
- Full-screen dark layout (`fixed inset-0`, `bg-slate-950`) with a centred column.
- Pulsing AI orb: layered concentric rings with `animate-ping` + a soft `bg-primary` blurred glow halo behind it. Subtle particle shimmer = a few absolutely-positioned dots with staggered `animate-pulse` and `blur`.
- Status messages stack: shows one message at a time, each fades in/up then fades out before the next mounts (CSS keyframe via existing `animate-fade-in` + an exit class). ~1.8s per message.
- Messages are built from Day 1 data (audience, superpower, problem, outcome, expert type) read from `state.challenge.aiOutputs.day1Setup`. Example template:
  - `Reviewing {audience}…`
  - `Analysing your superpower in {superpower}…`
  - `Pulling in your Day 1 insights…`
  - `Mapping archetypes for {expertType || "your audience"}…`
  - `Building your quiz around {outcome}…`
  Each falls back to the generic line if the Day 1 field is empty.
- Fires `supabase.functions.invoke("day2-thread", { moment: "sample_quiz", inputs: { … } })` on mount.
- Resolves when **both** the animation cycle finishes *and* the API returns (whichever is slower).
- On success: writes `day2_s2_quiz` + sets `day2_step: "2"` in `AppContext`, then triggers a brief fade-out class before unmounting (parent route swap handles the reveal).
- On error: toast + sets `day2_step: "1"` so the user is returned to Step 1.

**Edit** — `src/components/Day2Screen1.tsx`
- Strip the API call out of `handleGenerateQuiz`. The click now just sets `day2_step: "generating"` (no network, no spinner state on the button itself — the overlay owns that).
- Keep the QA-unlock / `allOpened` gating.

**Edit** — `src/pages/DayChallenge.tsx`
- Extend the Day 2 step switch:
  ```
  step === "generating" → <Day2QuizGenerating />
  step === "2"          → <Day2QuizPlayable onBack={…} />
  default               → <Day2Screen1 />
  ```

## Animation details

- Orb: 96px primary-coloured circle, blurred glow halo behind (`blur-3xl opacity-40`), one slow pulse ring (`animate-ping`) and a fast inner ring. Pure CSS, no extra deps.
- Messages: absolute-positioned in a fixed-height slot to avoid layout shift; each `key`-mounted node uses `animate-fade-in` on enter; on exit we set an `opacity-0 translate-y-2 transition` for ~250ms before unmount.
- Final reveal: when handoff happens, the overlay fades its container to `opacity-0` over ~400ms then unmounts, while `Day2QuizPlayable` mounts with its existing `animate-fade-in`.

## Style

- Dark deep-navy background even in light mode (overlay owns its own palette so it always pops).
- Centred column, max-w-md, mobile-first.
- No new dependencies, no new routes — purely a third value of the existing `day2_step` state flag.

## Out of scope

- No changes to the playable quiz itself or to Step 1's other content.
- No changes to the edge function payload.
