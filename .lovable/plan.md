

## Rebuild Landing Page (Leadio – Zero-Friction Entry)

Replace the current 644-line, multi-section landing page with a clean, high-conversion entry that gets users straight into `/join` with no assessment friction.

### What the new page contains

1. **Hero**
   - Headline: *"Build a 3-day challenge that grows your audience for you"*
   - Sub: *"No content grind. No ads. Just a simple system that turns people into promoters."*
   - Primary CTA button: *"Start your 3-day challenge"* → routes to `/join`
   - Supporting line under CTA: *"Takes less than 30 seconds to start"*

2. **3-step visual diagram** (right of hero on desktop, below on mobile)
   - Step 1 — Start challenge (Rocket icon)
   - Step 2 — Invite others (Users icon)
   - Step 3 — Unlock growth (TrendingUp icon)
   - Connected with subtle arrows, clean minimal cards

3. **Momentum section**
   - Title: *"Most people overthink this"*
   - Body: *"The fastest builders don't plan — they start. You'll figure it out as you go."*

4. **Promise band**
   - *"In 3 days, you'll have a working challenge that brings in new people automatically."*

5. **Live social proof feed** (auto-rotating vertical scroll)
   - "Sarah started her challenge"
   - "James launched Day 2"
   - "Maria invited 3 builders"
   - Reuse existing `ActivityFeed` component or a lightweight inline ticker with smooth fade+slide

6. **Bottom CTA**
   - *"Start building now — it's free"* → `/join`

### What gets removed

- Assessment/quiz language and any "Take quiz" CTAs
- All current sections not in spec: Features grid, Why This Works, How It Works, Who This Is For, Examples, Urgency/countdown, FAQ accordion, Founding Partner panel
- The `useCountdown` hook and CMS-driven landing content blocks (the page becomes static copy — CMS Landing editor will no longer drive this version)
- The default CTA route `/assess` — all CTAs now go to `/join`

### Technical changes

- **`src/pages/Landing.tsx`** — full rewrite. Keep `useReveal` + `useScrollDepth` + `Reveal` wrapper + `Cta` helper (retargeted to `/join`). Drop `useCountdown` and the CMS `useSiteConfig` dependency for landing copy (copy is hardcoded per spec).
- **CTAs** fire existing `trackEvent("landing_cta_clicked", { section })` analytics.
- Use existing design tokens (`cta-premium`, primary/accent), Tailwind animations (`animate-fade-in`, `hover-scale`), and lucide icons already in the project.
- Subtle motion: fade-in + slide on section reveal (already wired via `useReveal`).
- Responsive: hero is 2-column on `md+`, stacked on mobile.

### Files touched

- `src/pages/Landing.tsx` (rewrite)

No routing, context, or component dependency changes required. The `/join` route already exists in `App.tsx`.

