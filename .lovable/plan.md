## Goal

Figure out why `{{name}}` in the Subject field isn't being replaced when you send a test, and make the result obvious so we can confirm a fix.

## What's correct already

- The token to use is **`{{name}}`** — exactly two opening braces, the word `name`, two closing braces, no spaces.
- Other supported tokens: `{{email}}`, `{{referral_url}}`, `{{referral_code}}`, `{{unsubscribe_url}}`.
- Single-brace `{name}` is **not** supported and will never substitute. We can add it as an alias if you want (see optional step below).
- The `send-newsletter` Edge Function already calls the substitution on both the subject and the body for test sends and live sends. So in theory, typing `{{name}}` in Subject and `Jane` in the Test name field should produce a subject like `[TEST] Jane`.

## Likely culprits

1. **Edge Function in Test wasn't redeployed** after the recent edits adding `testName` and the referral tokens, so the old code (which didn't substitute the subject) is still running. Logs show it booted recently, but a forced redeploy will rule this out.
2. **Smart-quote / Unicode braces** snuck in if you copy-pasted the token. `{{` and `}}` must be plain ASCII.
3. **Test name field empty** — if blank, the substitution still runs but replaces `{{name}}` with the literal word `there`, which can look like nothing happened.

## Plan

### Step 1 — Force-redeploy the Edge Function
Redeploy `send-newsletter` so we are 100% sure the latest substitution code is live in Test.

### Step 2 — Echo the rendered subject back to the UI
Update `send-newsletter` test mode to include the **final substituted subject** in the JSON response, e.g. `{ ok: true, test: true, renderedSubject: "[TEST] Jane" }`.

Update `AdminNewsletter.tsx` `sendTest()` to show that rendered subject in the success toast, e.g.
`Test sent to you@x.com — Subject: [TEST] Jane`.

This way you can immediately see whether the server rendered it correctly, separate from any inbox / preview-pane weirdness.

### Step 3 — Server-side input normalisation
In `send-newsletter`, before calling `substitute()`:
- Normalise common Unicode look-alikes for `{` and `}` (e.g. `｛`, `｝`) to plain ASCII braces.
- Collapse `{{ name }}` (with spaces) to `{{name}}` so spaces inside braces still work.

This fixes the most common silent-failure causes.

### Step 4 — Live test
Send a test to your own address with subject `Hi {{name}} 👋` and Test name `Jane`.
Expected: toast shows `Subject: [TEST] Hi Jane 👋`, and the email arrives with that subject.

### Optional — Support single-brace `{name}` as an alias
If you'd prefer the shorter syntax, we can add `{name}`, `{email}`, etc. as aliases that resolve to the same values. Flag if you want this; otherwise we stick with `{{name}}` only (safer because single braces show up in normal copy more often).

## Files to change

- `supabase/functions/send-newsletter/index.ts` — normalise input, return `renderedSubject` in test response.
- `src/pages/AdminNewsletter.tsx` — show `renderedSubject` in the test success toast.

## Out of scope

- Changes to the body substitution (already working; the editor wraps tokens in `<span>` which the current splitter handles fine because both halves of the token end up inside the same text node).
- Per-recipient subject preview for live sends (we're only debugging the composer flow).
