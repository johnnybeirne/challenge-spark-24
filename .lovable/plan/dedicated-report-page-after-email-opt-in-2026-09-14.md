# Dedicated report page after email opt-in

Today, when someone enters their name and email on the results page ("Not ready for the challenge? Get your report instead"), the results page itself switches into a logged-in-looking preview with the verify-code banner at the bottom. Nothing moves to a new page. This change gives them their own report on its own page.

## What changes

1. New page at /report (standalone, no app navigation or sidebar — same pattern as the quiz/results pages):
   - Shows the person's own report, personalised from the quiz answers already stored on their device: their name, score ring, System/Audience/Conversion breakdown with band advice, and their diagnosis title and message.
   - Shows the name and email they typed, in the top corner, same as today's preview identity.
   - Keeps the "enter the 6-digit code from your email" banner on this page, using the existing editable copy. Entering the code signs them in for real and the banner disappears.
   - A gentle prompt at the end inviting them to join the 3-Day Challenge (links to the existing join flow — no new signup route).
   - Survives refresh: reads from the same saved preview state already used today.

2. Opt-in form (results page): on successful submit, send them to /report instead of staying on the results page.

3. Nothing else changes: the results page itself, the challenge join flow, the score ring, the three-column breakdown, the advisor block, the verify-code logic, and all admin editors stay as they are. /my-report (the existing page for signed-in report-only accounts) is untouched.

## Technical notes

- New file: src/pages/Report.tsx; one new route in src/App.tsx (outside AuthGuard, since the person is not signed in yet).
- Data source: existing AppContext assessment state (persisted in localStorage) plus reportPreview (name/email). No reliance on auth.uid() while unverified.
- Reuses the existing ReportVerifyBanner component and verifyOtp flow unchanged.
- Edit: one navigation change in src/components/ResultsReportOptIn.tsx.
- After verification succeeds, the existing flow already loads their saved assessment from the backend, so the same report keeps showing.
