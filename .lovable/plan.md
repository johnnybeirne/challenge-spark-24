## Recommendation

Yes — anchor the whole offer on the $497 number and make the invite path the hero. People only feel a discount when they see the price they're skipping. Right now both buttons look equal, so the free path doesn't feel like a win.

Two things to change in the "Want to go deeper on quiz funnel strategy?" card:

### 1. Stack the buttons (primary on top)

Put **Invite three friends to unlock** on top as the primary CTA, full-width, and demote **Upgrade to full course** to a smaller secondary link underneath. Side-by-side equals "pick either"; stacked with hierarchy equals "do this, or fall back to that."

```text
┌────────────────────────────────────────────┐
│   🎁  Invite 3 friends — unlock free       │  ← primary, full width, accent
│        (worth $497)                         │
└────────────────────────────────────────────┘
        or upgrade now for $497  →             ← small secondary link, centered
```

### 2. Anchor the $497 in three places

- **Card body copy** — name the price up front so the free path has something to be free *of*:
  > "The full course is **$497**. Invite three friends and it's yours free — or upgrade now and skip the invites."
- **Primary button** — small "worth $497" subline under the main label so the value lands at the moment of decision.
- **Secondary link** — show the actual price ("upgrade now for $497") instead of hiding it behind "Upgrade to full course". A visible price feels honest; a hidden one feels like a trap.

### Why this works

- One primary action removes the 50/50 paralysis. The invite button wins by visual weight, not by the user having to decide.
- "Worth $497" reframes the invite from "do work for free" to "earn $497." Same action, completely different feeling.
- Showing the price on the upgrade link makes the free path feel like the obvious move for most people, while still letting the small minority who'd rather just pay click through without friction.

### Scope of the change

- File: `src/components/Day2Screen1.tsx`, the "Want to go deeper on quiz funnel strategy?" card (around lines 695–710).
- Replace the side-by-side `flex-col sm:flex-row` button row with: primary `<Button>` (full width, accent) wrapping the invite link with a "Worth $497" subline, then a small centered text-link below it for the paid upgrade.
- Update the card body copy to name the $497 once.
- No new components, no logic changes, no routes added.

## Questions for you

1. Confirm the primary button copy: **"Invite 3 friends — unlock free (worth $497)"** — or do you want a different phrasing?
2. Confirm the secondary link copy: **"or upgrade now for $497 →"** — or do you want it framed as "skip the invites — $497"?
3. Should the $497 ever be shown crossed-out (e.g. ~~$497~~ FREE) on the primary button, or is "worth $497" enough?
