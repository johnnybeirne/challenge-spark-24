## Goal

Add a **"Signed up after"** date filter to the newsletter audience picker so the second send (tomorrow) only goes to people who joined the waitlist after a chosen cutoff.

---

## UI changes — `src/pages/AdminNewsletter.tsx` (Audience tab, `filter` mode)

Add one new control alongside the existing tier / minimum-invites filters:

- **"Signed up after"** date+time picker (shadcn Popover + Calendar, plus a time input).
  - Optional — leave empty to include everyone (current behaviour).
  - Stored in the campaign's `audience` JSON as `signedUpAfter: ISO string`.
  - Helper buttons: **"Just now"** (sets to current timestamp) and **Clear**.
  - Small hint under it: *"Only includes waitlist signups created after this moment. Use this to send a follow-up to new joiners."*

The recipient-count preview already re-runs when audience changes, so the count will live-update as soon as a date is picked.

---

## Send logic — `supabase/functions/send-newsletter/index.ts`

In the audience query (the `filter` branch), add:

```ts
if (audience.signedUpAfter) {
  q = q.gt("created_at", audience.signedUpAfter);
}
```

No other change needed — suppressions, tier, min-invites all keep working.

---

## Workflow this enables

1. **Today** — compose the bonus reminder, audience = `filter` with no date → 9 recipients → Send.
2. **Save the campaign as a template** (already supported) so you can reuse the body verbatim.
3. **Tomorrow** — duplicate / new campaign from that template, set **Signed up after = yesterday's send time** → only new signups receive it. Repeat any day with a fresh cutoff.

---

## Out of scope

- Auto-exclude based on `newsletter_sends` history (you chose date filter only).
- Recurring/scheduled sends.
- Storing "last sent at" per template.

---

## Verification

1. Pick a date in the future → recipient count = 0.
2. Pick a date 1 minute ago → count matches signups since then.
3. Send a test campaign with the filter → only matching rows appear in `newsletter_sends`.
