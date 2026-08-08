# Standard Unlock Gate — pay or invite 3

One reusable gate you can drop on any locked content (Day 1 first), with a short phrase you can reuse in future prompts.

## How it behaves

Locked content shows a short teaser (first lines readable), then the rest is replaced by one unlock card offering two equal paths:

- Invite path: "Invite 3 friends to unlock" with live progress (1 of 3 joined) and the participant's own referral link (reuses the existing referral link field with click-to-copy).
- Buy path: "Unlock now — $97" button opening the existing embedded checkout.

Once either condition is met, the gate disappears and the full content renders. Unlock is permanent per participant.

Unlock rules:
- Invite: 3 people signed up through the participant's link (the existing direct-referral counter).
- Buy: successful payment for that gate's item.

## Owner controls

A new "Unlocks" section in the owner console lists every gate in the app. For each gate the owner can edit:
- Price (default $97) and whether the buy path is shown
- How many invites are required (default 3) and whether the invite path is shown
- Heading, body copy, and button labels
- Whether the gate is on or off (off = content open to everyone)

Changing the price in the console updates what participants see and pay, with no code change.

## Where it goes now

Day 1 gets the gate first. After that, you can say to me:

"Put the standard unlock gate on <thing>, gate key <short-name>."

and I will wrap that content with the same component and add the new gate to the owner console list — nothing else needs describing.

## Technical notes

- New table `unlock_gates` (key, enabled, title, body, price_cents, invites_required, show_buy, show_invite, teaser_lines) with RLS: public read, admin write, plus the required GRANTs.
- New table `unlock_grants` (user_id, gate_key, source: purchase | invites, granted_at) with per-user RLS; the payments webhook writes purchase grants server-side.
- `src/hooks/useUnlockGate.ts` — reads gate config + grant, compares `state.network.direct` against `invites_required`, returns `{ unlocked, reason, config }`.
- `src/components/UnlockGate.tsx` — teaser + card, renders `ReferralLinkField` on the invite side and `useStripeCheckout` on the buy side; one Stripe price per gate created via the payments tools.
- Day 1 (`src/pages/Day1.tsx`) wraps its content in `<UnlockGate gateKey="day1">`.
- Admin page `src/pages/AdminUnlockGates.tsx` at `/owner-console/unlocks`, linked from the admin sidebar.
- Analytics events: gate viewed, invite path clicked, buy path clicked, gate unlocked.
