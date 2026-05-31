## Add sonar-pulse thinking indicator to the assessment loading screen

Add a soft, expanding ring animation around the Johnny B AI avatar on the post-quiz loading screen (`src/pages/Assessment.tsx`) so it visibly signals "thinking" before results load. Pure visual change — no logic, timing, or scoring touched.

### What changes

1. **`tailwind.config.ts`** — Add a new `sonar-pulse` keyframe and animation:
   - `0%`: `transform: scale(1); opacity: 0.55`
   - `100%`: `transform: scale(1.9); opacity: 0`
   - Animation: `sonar-pulse 1.8s ease-out infinite`

2. **`src/pages/Assessment.tsx` (loading screen block, lines 120–138)** — Wrap the avatar `<img>` in a relative container with two absolutely-positioned ring elements behind it:
   - Both rings: `absolute inset-0 rounded-full ring-2 ring-primary/40 animate-sonar-pulse`
   - Second ring gets `animation-delay: 0.9s` (staggered second wave) via inline style.
   - Avatar sits on top (`relative z-10`).
   - No change to size, layout, name label, typewriter text, or 4s timeout.

### Result

Two soft indigo rings continuously expand outward from the avatar and fade — a calm, alive "processing" pulse that doesn't reuse the three-dot pattern.
