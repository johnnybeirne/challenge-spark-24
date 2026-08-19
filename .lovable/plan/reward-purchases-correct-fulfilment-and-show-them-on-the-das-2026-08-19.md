# Reward purchases: correct fulfilment and show them on the dashboard

## What I verified

- The purchase made at 07:25 today was recorded with `price_id = leadio_premium_lifetime_usd`, and the account was flagged premium at 07:25:54.
- The webhook logs for that payment contain no `[reward-rung]` entries, so the session reached the webhook without a `gate_key`, and it fell into the premium branch.
- There are no reward grants at all: the only `unlock_grants` rows are `day1`, `day2`, `day3` from invites.

So the rung purchase was fulfilled as a premium upgrade, which is why the return page says "Open Premium Course". The exact reason the gate key was lost between the Buy button and Stripe is not yet confirmed, so confirming it is step 1.

## 1. Confirm where the gate key was lost

Add temporary structured logging in the checkout function that records the received price key, gate key and resolved user for every session, then run one test rung purchase in test mode and read the logs. Three candidates:

- the Buy button opened a session for the premium price instead of the rung price,
- the rung in the stored ladder config has no gate key (stale saved config on the device),
- the gate key is sent but dropped before the Stripe session metadata.

The fix in step 2 is applied to whichever the log names.

## 2. Stop premium being granted by accident

- The premium branch in the webhook becomes explicit: it runs only when the purchased price key is the premium price. Anything else with no recognised gate key is recorded as a purchase and logged as unfulfilled, never granted premium.
- The Buy button on a rung refuses to open checkout if the rung has no gate key, with a clear message, so a rung can never be sold as premium again.
- Repair the affected account: remove the incorrect premium flag and premium unlocks, and write the correct reward grant for the rung that was actually bought.

## 3. Return page shows the real purchase

The return page keeps polling, but when the purchase is not a recognised reward and not the premium price it shows a neutral "Payment complete" state with links back to Rewards and the dashboard, instead of asserting Premium.

## 4. Purchased rewards on the dashboard

Add a new numbered item to the Your assets accordion titled "Your rewards", listing every reward the participant holds:

- each reward earned by points or bought, with a short note on how it was unlocked,
- a link that opens the reward,
- an empty state pointing to the Rewards Ladder when nothing is unlocked yet.

The list reads the participant's grants plus their points against the ladder, so bought and earned rewards appear in one place. Copy follows the existing rules: no em dashes, sequence based language, no product name in participant facing text.

## Technical notes

- Files: `supabase/functions/create-checkout/index.ts`, `supabase/functions/payments-webhook/index.ts`, `src/pages/Rewards.tsx`, `src/pages/CheckoutReturn.tsx`, `src/components/DashboardAssetsSection.tsx`.
- Reward state source: `unlock_grants` filtered on `reward_gate_` keys, joined in the client against the ladder rungs in `SiteConfigContext`.
- Account repair is a one-off data correction on `profiles`, `unlocks` and `unlock_grants` for the affected user.
