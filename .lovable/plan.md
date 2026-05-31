## Make every urgency reference dynamic — "Have this live by [Day Name]"

Today the app already has fully dynamic countdown timers and locked-day labels (driven by `state.challenge.startedAt` / `state.user.joinedAt`). What's static today is the **urgency copy** itself — e.g. `Results.tsx` hardcodes "Your first real win is 3 days away. Don't put this off." and the expired-countdown banner hardcodes "Your 3-day challenge window has ended."

Goal: every urgency CTA/banner reads as a variation of **"Have this live by [Day Name]"** where `[Day Name]` is the weekday of `signupDate + 3 days`. The template text is editable in admin; the day is always computed live.

Out of scope (intentionally): product/marketing copy that mentions "3-day builder challenge" as a product name (e.g. landing-page hero, SEO descriptions, partner share blurbs). That's a product label, not a deadline. The user asked specifically about date/deadline/urgency CTAs.

---

### 1. New util + hook — single source of truth

**`src/lib/deadline.ts`** (new)
- `DEADLINE_OFFSET_DAYS = 3`
- `getDeadlineDate(anchorISO?: string): Date` — returns `(anchor ?? now) + 3 days`. Anchor = `state.challenge.startedAt` if set, else `state.user.joinedAt`, else `Date.now()`.
- `getDeadlineDayName(date: Date, locale?: string): string` — weekday long name ("Friday"), using user locale.
- `formatDeadlineDate(date: Date, locale?: string): string` — e.g. "Fri, Jun 6".
- `renderUrgency(template: string, ctx: { day: string; date: string }): string` — replaces `{day}` and `{date}` tokens.

**`src/hooks/useDeadline.ts`** (new) — pulls anchor from `useAppState()` and returns `{ deadlineDate, dayName, dateLabel, render(template) }`. Recomputes when state changes.

### 2. Admin-editable templates in `site_content`

Seed page=`global`, section=`urgency` rows (insert tool, on conflict do nothing):

| key | default value |
|---|---|
| `results_low` | `Have this live by {day}. Your first real win is 3 days away — don't put this off.` |
| `results_mid` | `Have this live by {day}. Don't let another month pass on the same plateau.` |
| `results_high` | `Have this live by {day}. Spots are limited — the next cohort starts in days, not weeks.` |
| `countdown_expired` | `Your 3-day window has ended. Restart and have this live by {day}.` |
| `dashboard` | `Have this live by {day}.` |
| `locked_day` | `Day {n} opens {when}. Have this live by {day}.` (uses existing `{when}` slot from `getDayUnlock`) |
| `upgrade_card` | `Have this live by {day} — upgrade to keep momentum.` |
| `cta_generic` | `Have this live by {day}.` |

All editable via existing `useSiteContent("global")` reader. Admin CMS already lists `site_content` rows by page/section, so they appear automatically.

### 3. Consumers to update (UI swap only, no layout change)

- **`src/pages/Results.tsx`** (lines 234–239 + render at 390): delete the static `urgencyLine` block. Replace render with `siteContent("urgency.results_" + archetypeTier, fallback)` then `renderUrgency(template, deadlineCtx)`.
- **`src/components/ChallengeCountdown.tsx`** (line 47, expired state): swap hardcoded "Your 3-day challenge window has ended." for `renderUrgency(siteContent("urgency.countdown_expired"))`.
- **`src/pages/DayChallenge.tsx`** locked-day screen (lines 159–171): keep existing `{unlock.label}` line. Below it, render an additional muted line: `renderUrgency(siteContent("urgency.locked_day"), { day, when: unlock.label, n: dayNum })`.
- **`src/pages/Dashboard.tsx`** — add a single small urgency line under the page header using `urgency.dashboard` template (no layout shift, just a `<p className="text-sm text-muted-foreground">`).
- **Upgrade cards** — search for upgrade card components and add the `urgency.upgrade_card` line where a date-bound CTA currently has no time reference or has a static one. (Will inspect during build; only swap, no layout change.)

### 4. Leave alone (already dynamic or out of scope)

- `ChallengeCountdown` active-state timer + `CountdownBottomBar` — already live.
- `ChallengeSidebar` per-day calendar dates — already live.
- `getDayUnlock` "Tomorrow, Jun 5" labels — already live.
- Product/marketing copy mentioning the "3-day challenge" product name (Landing, Signup, AssessmentResultCard, HowItWorks, Workflow, PartnerDashboard, PartnerPerformance, SEO descriptions).
- Admin-only date renderings (AdminSignups, AdminCoupons, CmsCopilot QA date).
- Dead `SiteConfigContext` fields (`urgencyText`, `urgencyBody`, `cohortStartDay`) — not consumed anywhere, no behaviour change needed.

### 5. Small cleanup (one-liner)

`src/context/AppContext.tsx` lines 172–173 duplicate `72 * 60 * 60 * 1000`. Import and use `CHALLENGE_DURATION_MS` from `challengeWindow.ts` so the constant stays single-sourced. (Pure refactor — no behaviour change.)

---

### Result

Every urgency banner and CTA renders as "Have this live by Friday" (or whichever weekday is signup+3 for that specific user), computed live each render. Admin can edit the wording in CMS via the new `global / urgency` rows; the `{day}` and `{date}` tokens stay dynamic. Functionality, scoring, and layout untouched.
