# Plan: Make the /jv-partners journey visual and punchy

Scope: only the "How it works" journey section in `src/pages/JvPartners.tsx`. No other section, no other file.

## Cut the copy hard

Replace each step's paragraph with a 2-4 word punchline + one short supporting line (max ~10 words). Add a big number/stat or icon glyph that does the visual lifting.

New step content:

1. **Purple · 01** — "You promote once" — _One link. One post._ → icon: Megaphone
2. **Purple · 02** — "They get diagnosed" — _Pioneer · Architect · Authority_ → 3 mini archetype chips
3. **Purple · 03** — "They join the challenge" — _3 days. Real build._ → icon: Rocket
4. **Amber · REWARD** — "You hit the leaderboard" — _Seen by every participant._ → mini leaderboard glyph (3 bars with a crown on top)
5. **Purple · 04** — "They invite. Then they invite." — _Your name stays at the origin._ → branching nodes glyph (1 → 3 → 9)
6. **Amber · REWARD** — "Your offer = the reward" — _Earned, not advertised._ → Gift icon with sparkle
7. **Green · ∞** — "Your reach compounds" — _One promotion. Infinite waves._ → big Infinity glyph, oversized

## Make it visual

- **Bigger step number**: 56px circle (was 44px) with bold display weight, more presence.
- **Iconography per step**: each journey card gets a dedicated lucide icon in a tinted square next to the number (Megaphone, Sparkles, Rocket, Network).
- **Stat / glyph row**: each card includes a small visual element under the punchline — archetype chips for step 2, a 3-bar leaderboard SVG for step 4, a "1 → 3 → 9" branching row for step 5, sparkle row for step 6.
- **Final outcome card**: full-width gradient (primary → emerald), oversized `Infinity` glyph as a watermark behind the text, white text on gradient. This is the payoff — should feel like a finale, not another card in a list.
- **Connecting line**: thicker (2px), gradient color that morphs between sections (purple → amber → purple → amber → emerald). Animated scaleY on scroll as today.
- **Reward cards**: keep the amber pulsing ring, but add a small "REWARD" tag chip in the top-right corner and a Gift/Trophy icon as a watermark in the card background at low opacity.

## Layout & density

- Cards stay vertically stacked, `max-w-md`, mobile-first.
- Reduce padding from `p-5` to `p-4` so cards feel tighter and more scannable.
- Title size up to `text-base` bold, supporting line `text-xs text-muted-foreground`.
- Two-line max per card means the eye scans the whole journey without reading paragraphs.

## Animation

Keep the existing per-step IntersectionObserver fade-up + animated connecting line. Add a subtle scale-in (0.95 → 1) on the icon/number circle when each card enters view to make it feel snappier.

## Out of scope

- Hero, offer card, leaderboard mockup, network-effect row, benefits grid, CTA — all untouched.
- No new routes, no copy changes outside this section, no other files.
