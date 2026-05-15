## Problem

In the email body, `{{referral_url}}` (and `{{unsubscribe_url}}`) get text-substituted to a URL, but if you typed the token as **plain text** in the editor, the result is plain text in the email — not a clickable link. That's what your screenshot shows.

There are two ways to make a link today, and only one of them currently works without changes:

1. **Hyperlink with URL `{{referral_url}}`** (Quill toolbar → link icon → paste `{{referral_url}}` as the URL). This works now — Quill stores `href="{{referral_url}}"`, the substitution swaps the URL, and the email arrives clickable.
2. **Plain text `{{referral_url}}` in the body.** Substitutes correctly but renders as flat text. This is what bit you.

## Plan

Make plain-text URL tokens auto-clickable so option 2 also "just works".

### Step 1 — Auto-linkify URL tokens in the body
In `supabase/functions/send-newsletter/index.ts`, before running token substitution on `campaign.html_body`:

- Find any **bare** `{{referral_url}}` or `{{unsubscribe_url}}` (i.e. not already inside an `href="..."` attribute, and not already wrapped in an `<a>`).
- Wrap each with `<a href="{{referral_url}}" style="color:#4f46e5;text-decoration:underline;">{{referral_url}}</a>`.

Then run substitution as normal. Result: the URL renders as a styled, clickable link.

The detection uses a regex pass that skips tokens already inside an attribute (`="...{{referral_url}}..."`) so we don't double-wrap when the user used the proper hyperlink option.

### Step 2 — Update the helper text on the Compose tab
Change the token tip line to:

> Tokens: `{{name}}`, `{{email}}`, `{{referral_url}}`, `{{referral_code}}`, `{{unsubscribe_url}}`. URL tokens become clickable links automatically — or use the link button in the toolbar to wrap your own text.

### Step 3 — Redeploy `send-newsletter`

### Step 4 — Verify
Send a test with body containing a plain `{{referral_url}}` line. Confirm the test inbox shows it as an underlined clickable link pointing to `https://leadio.johnnybeirne.com/waitlist?ref=PREVIEW123`.

## Files

- `supabase/functions/send-newsletter/index.ts` — add `autolinkUrlTokens()` helper, call it on `campaign.html_body` for both test and live sends.
- `src/pages/AdminNewsletter.tsx` — update the token-help paragraph.

## Out of scope

- `{{referral_code}}` stays plain text (it's a code, not a URL). If you want the code itself to act as a link to the referral URL, flag it and I'll add a separate `{{referral_code_link}}` token.
- No body-content rewriting beyond URL tokens.
