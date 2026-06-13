# Plan: /powered-by marketing page

A standalone public route that explains LeadBead to visitors arriving from a challenge footer link. Premium, dark, cinematic — outside the normal app shell.

## Files to create

1. **`src/pages/PoweredBy.tsx`** — the full page, all 7 sections + footer note. Self-contained component (no shared layout). Includes:
   - A small `Reveal` helper inside the file using `IntersectionObserver` (threshold 0.15, opacity 0 → 1, translateY 24px → 0, 600ms ease-out, stagger via per-child `transition-delay`). No external animation library.
   - Lucide icons: `GraduationCap`, `Briefcase`, `Monitor`, `Mic`.
   - Primary CTAs use existing `<Button>` from `@/components/ui/button` (default variant = app primary).
   - Self-referential footer link: the word "LeadBead" → `/powered-by`.
   - `<SEO>` component for title/description.

## Files to modify

2. **`src/App.tsx`** — add one route inside the public `<AppShell fullWidth />` group **OR** as a bare route outside `AppShell` so it has zero app chrome. Spec says "does not use the app shell or sidebar" → register as a standalone route outside any `AppShell` wrapper (same pattern as `/quiz-preview`):
   ```tsx
   <Route path="/powered-by" element={<PoweredBy />} />
   ```
   Plus the import line. Nothing else in App.tsx changes.

No other files touched. No nav menu entry. No changes to existing routes, tokens, or components.

## Section build order (matches brief exactly)

1. **Hero** — `min-h-screen`, headline ≥ `text-4xl md:text-6xl lg:text-7xl`, subhead, primary CTA → `/`. Background: CSS-only dark radial gradient with a slow `@keyframes` pulse/shift applied inline via a `<style>` tag scoped to the page (or Tailwind arbitrary values + `animate-[...]`). Uses near-black bg (`bg-background` is already dark in this project; fall back to `bg-[#070708]` if needed for "darkest available").
2. **Core idea** — centered single statement + paragraph.
3. **How it works** — 3 cards, `grid md:grid-cols-3`, staggered reveal (0/100/200ms).
4. **Referral engine** — `grid md:grid-cols-2`. Right column = pure CSS animated triangular diagram: 3 nodes + a glowing dot that travels the path on a continuous `@keyframes` loop (`animation-duration: 6s, infinite`).
5. **Who it is for** — 2×2 grid with Lucide icons.
6. **Points & progression** — vertical 5-tier ladder with a connecting line; tier 3 gets a `ring`/`shadow` glow via `shadow-[0_0_40px_hsl(var(--primary)/0.5)]`.
7. **Final CTA** — full-width centered, headline + sub + button → `/` + reassurance line.
8. **Footer note** — small centered text, "LeadBead" links to `/powered-by`.

## Design tokens

- Use existing semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`, `border-border`). No hardcoded color classes in components other than the one near-black page wrapper if `--background` isn't dark enough.
- Typography: rely on app's existing font stack; size via Tailwind scale (`text-4xl` → `text-7xl` for hero).
- All transitions hand-rolled with Tailwind utility classes + a tiny IntersectionObserver hook inside the file.

## Responsive

- Mobile-first. Hero shrinks to `text-4xl`. Grids collapse to single column under `md`. Tested mentally at 375 / 768 / 1280.

## What I will NOT touch

- No edits to `AppShell`, `ChallengeSidebar`, `BottomNav`, design tokens, or any existing page.
- No new dependencies.
- No nav menu entry.

Ready to switch to build mode when you approve.