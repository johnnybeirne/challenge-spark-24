## Goal

Continue the "You're an [archetype}" narrative thread from the quiz Results page into the challenger dashboard, so the user feels like one conversation — not "took a quiz" → "landed in a tool".

## Where it lives today

- **Results page** (`src/pages/Results.tsx`) — large hero: *"Based on your answers… You're an Architect"* + tagline + Johnny message.
- **Dashboard** (`/challenger-dashboard`) — opens with training video card, then `AssessmentResultCard` (shows score % + "Builder Stage" + diagnostic title). The archetype name ("Architect") is **never shown**. A `DashboardProfileHeader` component exists that *does* compute the archetype, but it's imported and never rendered.

So the thread literally breaks the moment they hit the dashboard.

## Recommendation: a single "Architect strip" as the dashboard's first row

Add one slim, personal banner at the very top of `/challenger-dashboard` — above the training video — that picks up where Results left off:

```text
┌─────────────────────────────────────────────────────────────┐
│ 👤  Welcome back, Johnny — Architect · 62/100               │
│     "You have the pieces. Now let's connect them."          │
│     The next 3 days are built around that. ── Day 1 active  │
└─────────────────────────────────────────────────────────────┘
```

Why first row, above the video:

- It's the literal continuation of the Results page hero — same words, same tone, same accent colour.
- The training video card below then reads as *"…and here's how we start"* instead of a cold open.
- One row, no extra clicks — doesn't compete with the existing "Your progress" / Day 1-2-3 card.

## What the strip contains

1. **Archetype label** — "Architect" (Pioneer / Architect / Authority), reusing `getTierLabel` already in `DashboardProfileHeader.tsx`.
2. **Score chip** — "62 / 100" with the same accent colour as Results (amber / blue / emerald via `getAccent`).
3. **Tagline** — the same one Results showed ("You have the pieces. Now let's connect them."), pulled from `archetypes.{tier}_tagline` site content so it stays in sync.
4. **Bridge sentence** — one line connecting archetype → challenge, e.g. *"Your 3-day challenge is shaped around what an Architect needs next."*
5. **Quiet "Review your diagnosis" link** → back to `/results` for anyone who wants the full Johnny message again.

## What changes vs. what stays

- **Keep** `AssessmentResultCard` where it is (below the video) — it carries the *mode* CTA ("Continue 3-Day Challenge") and the longer diagnostic message. Different job.
- **Remove** the orphaned `DashboardProfileHeader` import or repurpose its archetype logic inside the new strip — no duplicate score cards.
- **Don't** add the archetype again inside the sidebar / profile area — one canonical place keeps the thread clear.

## Alternative placements (if the top strip feels too prominent)

- **B. Inline eyebrow on the training video card** — "For Architects: here's how Day 1 looks for you." Lighter touch, but loses the score continuity.
- **C. Merge into `AssessmentResultCard**` — add the archetype name above the existing "Builder Stage" line. Cleanest code, but buries it below the video so the *first* thing the user sees is still generic.

Recommend **A** (top strip). B is the fallback if you want the dashboard to stay video-first.

## Technical notes

- New component: `src/components/DashboardArchetypeStrip.tsx`. Reads `state.assessment` + `useSiteContent("results")` for the archetype copy. No new data — everything is already in state.
- Render it in `src/pages/Dashboard.tsx` as the first child of the `<section className="mx-auto max-w-5xl space-y-6">` block (around line 444), before the training video.
- Hidden when `state.assessment` is null (returning user who never took the quiz) — fall back to the existing "Take the quiz" CTA already in `DashboardProfileHeader`.