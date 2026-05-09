# Split enrollment into three distinct pages

Today `/join` (challenge) and `/blueprint-join` (free course) both render the same `Signup.tsx` with identical copy. `/premium` has no logged-out enrollment at all. We'll separate them into three purpose-built pages so each product feels distinct, while sharing one underlying chat primitive so we don't duplicate logic.

## What changes

### 1. Extract shared primitive
Create `src/components/auth/SignupChat.tsx` containing the reusable parts of today's `Signup.tsx`:
- The Johnny B AI typing chat (name → email → password)
- Login mode + password reset
- Referral / partner code capture
- `signUp` / `signIn` calls and analytics

It accepts props for what differs between products:
- `headline`, `subcopy`, `stepHint`
- `johnnyPrompts` (per-step copy)
- `successHeadline`, `successSubcopy`
- `redirectAfterAuth`
- `productContext` (`"challenge" | "blueprint" | "premium"`) — passed to analytics + stored in user metadata
- Optional extra success-screen CTAs (e.g. "Add to calendar" for challenge, "Start Lesson 1" for blueprint, "Continue to checkout" for premium)

### 2. Three dedicated pages

**`src/pages/ChallengeSignup.tsx`** (route `/join`)
- Headline: "Start building your AI-powered challenge"
- Today's existing copy and 3-step flow
- Success: Add to Calendar + Continue to dashboard

**`src/pages/BlueprintSignup.tsx`** (route `/blueprint-join`)
- Headline: "Get your free Challenge Growth Blueprint"
- Subcopy framed around the 3-lesson mini-training + AI insight
- Johnny prompts tuned for course enrollment ("Welcome to the Blueprint — what's your name?")
- Success: "Open Lesson 1" + Continue to `/blueprint/dashboard`

**`src/pages/PremiumSignup.tsx`** (new, route `/premium-join`)
- Headline: "Enroll in Premium"
- Shows price + coupon summary (reads applied coupon from localStorage so a visitor who applied a code on `/premium` keeps it)
- Same chat primitive for account creation, then redirects to `/premium` (or directly into checkout) once authenticated
- Logged-out users hitting `/premium` are redirected here instead of the generic challenge signup

### 3. Routing & entry points
- `src/App.tsx`: keep `/join` and `/blueprint-join`, point them at the new dedicated pages; add `/premium-join`.
- `src/pages/Premium.tsx`: when no user is signed in, route to `/premium-join?redirect=/premium` (preserving any applied coupon) rather than the challenge signup.
- `src/pages/blueprint/BlueprintLanding.tsx`: unchanged (already targets `/blueprint-join`).
- `src/pages/ChallengeLanding.tsx` / other "Join the challenge" CTAs: unchanged (already target `/join`).

### 4. Analytics
Add a `product` field to the `signup_completed` event payload so we can split funnel reporting by Challenge vs Blueprint vs Premium. No new event names — stays within the canonical 35-event list.

### 5. Login behavior
All three pages still expose the same login form (top-right "Login" button). Login itself isn't product-specific; only the signup framing differs. After login we honor the `?redirect=` param so a user logging in from `/premium-join` lands back on `/premium`.

## Out of scope
- No changes to the actual auth backend, RLS, or Supabase tables.
- No changes to coupon/checkout logic — Premium signup just gets the user authenticated, then the existing `/premium` flow takes over.
- No visual redesign of the chat itself; only copy and surrounding chrome change per product.

## Files touched
- New: `src/components/auth/SignupChat.tsx`, `src/pages/ChallengeSignup.tsx`, `src/pages/BlueprintSignup.tsx`, `src/pages/PremiumSignup.tsx`
- Edited: `src/App.tsx`, `src/pages/Premium.tsx`, `src/lib/analytics.ts` (payload only)
- Removed: `src/pages/Signup.tsx` (logic moves into `SignupChat` + the three pages)
