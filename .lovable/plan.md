

## Widen app layout for desktop

The whole authenticated app currently renders inside narrow mobile columns (`max-w-lg` ≈ 512px, `max-w-[480px]`) regardless of screen size. On a wide monitor this looks like a phone-sized strip floating in the middle. We'll widen the content containers so they fill 80–90% of the viewport on desktop while staying mobile-friendly.

### Approach

Use a single shared content width that:
- Stays comfortable on phones (full width, padded)
- Expands progressively on tablet/desktop up to ~1280px (which is ~85% of a 1440px screen)

We won't redesign individual pages — just swap their wrapper widths. Cards/lists inside will naturally flow wider.

### Pages to update (replace narrow wrapper with responsive wrapper)

Change `max-w-lg mx-auto` and `max-w-[480px] mx-auto` to `max-w-6xl mx-auto` (1152px) with responsive padding `px-4 sm:px-6 lg:px-8`:

- `src/pages/Dashboard.tsx`
- `src/pages/DayChallenge.tsx` (both occurrences)
- `src/pages/Results.tsx`
- `src/pages/Community.tsx` (both occurrences)
- `src/pages/Leaderboard.tsx`
- `src/pages/Referrals.tsx`
- `src/pages/Rewards.tsx`
- `src/pages/RewardDetail.tsx` (both occurrences)
- `src/pages/Unlocks.tsx`
- `src/pages/Partners.tsx`
- `src/pages/PartnerDashboard.tsx`
- `src/pages/PartnerPerformance.tsx`

### Pages intentionally left narrow

- `src/pages/Signup.tsx` — `max-w-md` is correct for a focused auth form
- `src/pages/Assessment.tsx` — single-question conversational flow reads better narrow
- `src/pages/InviteBuilders.tsx` — focused share screen
- `src/pages/Landing.tsx` — already uses responsive `max-w-6xl`
- Admin pages — already wider, leave alone

### AppShell

`src/components/AppShell.tsx` outer wrapper changes from `max-w-[90vw]` to no width cap (just `w-full`), since each page now controls its own max-width. This prevents double-constraining.

### Optional inner tweaks

For pages with grid-friendly content (Unlocks, Rewards, Partners, Leaderboard, Referrals), once the wrapper is wide we can let card lists flow into 2–3 columns on `md:` / `lg:` breakpoints. I'll add `sm:grid-cols-2 lg:grid-cols-3` to obvious card grids where they exist, but keep single-column on mobile.

### Result

- Mobile (≤640px): looks identical to today
- Tablet (768px): content uses ~90% width
- Desktop (1440px): content uses ~80% width (1152px), centered, with cards able to sit side-by-side where it makes sense

