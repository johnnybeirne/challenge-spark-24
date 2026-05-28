## Goal

Let you preview the app as a user who signed up on a date you choose — both as a **quick local simulation** (no DB writes) and as a **persistent seeded test account** (real row in the database).

The challenge's "current day" is anchored to `challenge.startedAt` / `challenge_progress.started_at`. Backdating that value is what makes Day 2 / Day 3 content appear.

---

## Part 1 — Local simulation (extend the QA panel)

In the floating **QA Mode** panel (Beaker button, top-right, admins only), add a new **"Simulated signup date"** section:

- Shadcn date picker, defaults to today.
- "Apply" button: rewrites the local AppContext user so `joinedAt` and `challenge.startedAt` are set to the chosen date at the current wall-clock time, and recomputes `currentDay` from elapsed hours (1 = 0–24h ago, 2 = 24–48h, 3 = 48–72h, completed window beyond).
- "Clear" button: reverts to real values.
- A small caption shows the resulting day, e.g. *"Simulating Day 2 — started 26 hours ago"*.

Stored in `localStorage` alongside the existing `leadioPreviewState`, surfaced through the existing `useQaPreview` hook so a banner shows it's active. No backend writes, no leaderboard impact.

This is what you'll use day-to-day to flip between Day 1 / 2 / 3 views.

---

## Part 2 — Seeded test account (new admin page)

New page at **`/admin/test-accounts`** (linked from the admin sidebar) with two tabs:

**Create**
- First name, surname, email (defaults to `test+<timestamp>@leadio.test`).
- Signup date picker (defaults to today, allows any past date).
- "Create test account" → creates real rows:
  - `auth.users` (random password, email auto-confirmed) via an edge function using the service role.
  - `profiles` and `waitlist_signups` with `created_at` backdated.
  - `challenge_progress` with `started_at` backdated and `ends_at = started_at + 72h`.
- Flagged with `email LIKE 'test+%@leadio.test'` so they're easy to filter out.

**Manage**
- Lists all test accounts (filtered by the test email pattern).
- Shows signup date, current challenge day, email.
- Actions: **Copy magic-link** (sign-in URL you can open in an incognito window), **Delete**.

This gives you a real, persistent user you can actually log into — useful for end-to-end testing of emails, leaderboards, etc.

---

## Technical details

**Files added**
- `src/components/qa/SimulatedDatePicker.tsx` — date picker section mounted inside `QaModePanel`.
- `src/pages/AdminTestAccounts.tsx` — admin page (Create + Manage tabs).
- `supabase/functions/admin-test-account/index.ts` — edge function that verifies the caller is an admin via JWT + `has_role`, then uses the service role to insert backdated rows / delete test accounts / mint a magic link.

**Files edited**
- `src/lib/qaPreview.ts` — add `simulatedJoinedAt?: string` to `QaPreviewState`.
- `src/context/AppContext.tsx` — when `qa.simulatedJoinedAt` is set, override `user.joinedAt` and `challenge.startedAt` / `endsAt` / `currentDay` in the resolved state (read-only, never persists to Supabase).
- `src/components/QaModePanel.tsx` — mount the new date picker section.
- `src/App.tsx` — register `/admin/test-accounts` route.
- `src/components/admin/AdminSidebar.tsx` — add "Test accounts" link.

**Safety**
- Edge function rejects any non-admin caller and refuses to act on emails not matching `test+%@leadio.test`.
- Local simulation is fully client-side; never writes to Supabase.
- Existing "Exit Preview" button clears the simulated date alongside the rest of QA state.
