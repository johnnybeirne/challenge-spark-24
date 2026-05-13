
# LEADIO Partner Tracking & Affiliate System — Implementation Plan

## 1. What's already in place (audit)

- **Promoters table** (`promoters`): partner_code, tier (bronze/silver/gold/elite), conversions, assessment_starts, founding partner fields, `is_approved`. Created via `usePromoter.becomePromoter()` and `AdminPromoters`.
- **Profiles table**: already has `referred_by` (invite_code chain), `referred_by_parent` (level 2), `partner_code_used`, `signup_product`, `entry_intent`, `direct/indirect_referral_count`.
- **Purchases table**: stores `partner_code`, amount, status, environment.
- **Coupons table**: standalone (not tied to a partner yet).
- **Attribution today**: thin and inconsistent.
  - `?ref=` is read on `/assessment` only (`Assessment.tsx`) → stored in `sessionStorage["challengeos_ref"]` → passed as `referred_by` user metadata at signup → wired into `handle_new_user` trigger which uses it as a profiles `invite_code` lookup, NOT as a partner code lookup.
  - Partner attribution (for purchases) flows through `lib/partner.ts` (`leadio_partner_code` in localStorage), set only on `/p/:code`, `/partner/:code`, `/invite/:code`. NOT set by `?ref=` on `/assessment`, `/free-assessment`, or `/premium`.
  - `track_partner_assessment` RPC is called from Assessment when a `?ref=` is present, but it tries to match the value against `promoters.partner_code` AND the same value is also stored as `referred_by` (a user invite code). Two namespaces collide.
  - `process_partner_referral` is fired from the Stripe webhook on purchase and from `SignupChat` on signup, so signup-time partner attribution exists but only when the code came in via the `/p/...` path.

**Bottom line**: there are two parallel attribution systems (user-invite vs. partner) that share the same `?ref=` key but resolve differently, and no first-touch persistence rule.

## 2. Recommended database schema

New tables:

- **`partners`** (replaces overloaded use of `promoters` for affiliate logic; can also reuse `promoters` — see decision in Phase 0)
  - `id`, `user_id` (unique, FK auth.users), `slug` (unique, lowercase, URL-safe), `display_name`, `bio`, `avatar_url`
  - `status` enum: `pending | active | suspended`
  - `default_commission_type` enum: `percent | fixed`
  - `default_commission_value` numeric (percent 0-100 or cents)
  - `parent_partner_id` (nullable, for partner-invites-partner / level 2)
  - `manual_score_adjustment` integer default 0 (admin override for leaderboard)
  - timestamps
- **`referral_attributions`** (first-touch, permanent)
  - `id`, `user_id` (unique — one row per user), `partner_id` (FK partners), `partner_slug` (denormalized snapshot), `landing_path`, `landing_query` jsonb, `first_touch_at`, `bound_at` (when tied to user), `source` enum: `query_param | partner_landing | invite_link | manual`
  - One-row-per-user enforces "first touch wins" at the DB level.
- **`commissions`**
  - `id`, `purchase_id` (FK), `partner_id`, `user_id` (buyer), `amount_cents`, `commission_type`, `commission_value_snapshot`, `status` enum: `pending | approved | paid | revoked`, `payout_id` (nullable), `notes`, `created_at`, `approved_at`, `paid_at`
- **`payouts`**
  - `id`, `partner_id`, `total_cents`, `currency`, `status` enum: `pending | paid | cancelled`, `method` (stripe/wise/bank/manual text), `reference`, `notes`, `period_start`, `period_end`, `paid_at`, `created_at`
- **`partner_invites`** (partner-invites-partner audit trail)
  - `id`, `inviter_partner_id`, `invitee_email`, `invitee_partner_id` (filled on accept), `created_at`, `accepted_at`
- **Extend `coupons`**: add `partner_id` (nullable), `commission_type`, `commission_value` so a coupon code can both discount AND attribute to a partner.

Decision point for Phase 0: extend `promoters` (rename later) vs. new `partners` table. Recommendation — **add `partners` as the canonical model** and keep `promoters` as a compatibility view/back-fill source, because `promoters` mixes founding-partner mechanics with affiliate mechanics and the new model needs cleaner shape.

DB functions/triggers:
- `bind_attribution_on_signup()` trigger on `auth.users` insert: read attribution cookie via signup metadata `attribution_partner_slug` and create the `referral_attributions` row if none exists.
- `record_commission_for_purchase()` called from webhook: lookup attribution → snapshot commission rule → insert `commissions` row.
- `partner_leaderboard` view: signups + `manual_score_adjustment`.

## 3. Existing files / components likely affected

| Area | File(s) |
|---|---|
| Attribution capture | `src/lib/partner.ts` (rename → `attribution.ts`), new `src/lib/attribution.ts` for first-touch + cookie+localStorage |
| Capture entry points | `src/pages/Assessment.tsx`, `src/pages/Premium.tsx`, `src/pages/PartnerSales.tsx`, `src/pages/InviteEntry.tsx`, `src/pages/Landing.tsx`, `src/pages/ChallengeLanding.tsx`, `src/pages/blueprint/BlueprintLanding.tsx` (read `?ref=` everywhere or via a top-level `App.tsx` effect) |
| Signup binding | `src/components/auth/SignupChat.tsx`, `supabase/functions` (handle_new_user trigger) |
| Purchase wiring | `supabase/functions/payments-webhook/index.ts`, `supabase/functions/create-checkout/index.ts`, `src/hooks/useStripeCheckout.tsx` |
| Coupon flow | `src/lib/premium.ts`, `redeem_coupon` RPC, `src/pages/Premium.tsx`, `src/pages/AdminCoupons.tsx` |
| Partner dashboard | `src/pages/PartnerDashboard.tsx`, `src/hooks/usePromoter.tsx` (→ `usePartner`), new route `/partner-dashboard` (alias to existing `/promoter`) |
| Auto-affiliate on signup | `handle_new_user` trigger + `usePromoter.becomePromoter` (auto-call after first login) |
| Admin | `src/pages/AdminPromoters.tsx` (extend) + new `src/pages/AdminCommissions.tsx`, `src/pages/AdminPayouts.tsx`, `src/pages/AdminAttribution.tsx`; add reassign / merge / revoke actions |
| Routing | `src/App.tsx` add `/partner-dashboard` route + `?ref=` listener |
| Leaderboard | `src/pages/Leaderboard.tsx`, `src/lib/scoring.ts`, leaderboard view |

## 4. Risks

- **Namespace collision** between user invite codes (`profiles.invite_code`) and partner slugs sharing `?ref=`. Mitigation: resolve in priority order (partners.slug → profiles.invite_code) and store the resolved type in attribution.
- **First-touch vs. last-touch ambiguity** when a user clears storage, switches device, or signs in later on a different device. Plan: server-side row in `referral_attributions` keyed on user_id is the source of truth post-signup; pre-signup is best-effort cookie+localStorage.
- **Partner self-referral / cycles** (partner clicks own link, partner invites self). Validate at attribution and at parent_partner_id assignment.
- **Coupon abuse** (zero-price purchase still mints a commission). Decide: fixed-amount or 0 commission when amount_cents=0.
- **Refund handling**: existing webhook flips premium off but does not revoke commission. Must extend.
- **Stripe metadata size**: pass `attribution_partner_slug` and `coupon_code` only (not full attribution row).
- **GDPR / cookie consent**: long-lived cookie for permanent attribution requires updated privacy copy.
- **Backfill**: existing `promoters` + `purchases.partner_code` need a one-time migration into `partners` + `commissions`.
- **RLS**: partners must only see their own attributions/commissions; admins via `has_role('admin')`.
- **Auto-affiliate-on-signup** could create thousands of empty `partners` rows. Decision: lazily create on first dashboard visit OR auto-create with `status='active'` and `slug = profiles.invite_code` (cheap and consistent).

## 5. Edge cases

- User lands via `?ref=A`, browses, then arrives via `?ref=B` before signup — first-touch A wins.
- User has cookie attribution but signs up with no `?ref=` in metadata — still bind from cookie.
- User signs up first, *then* clicks a partner link — no rebind (first-touch is "first attributed touch", and signup without attribution counts as no attribution).
- Coupon code attributed to partner X used by visitor attributed to partner Y — decision: **purchase-time coupon partner overrides** for that specific commission only; original attribution remains on user.
- Partner deleted/suspended — historical commissions remain, future attributions blocked.
- Two partners merged — admin "merge" reassigns attributions + commissions to surviving partner.
- Self-purchase by partner — attribution should not create commission.
- Anonymous purchase (no user_id, e.g. guest checkout) — store attribution on `purchases.partner_code` only.
- Refund / chargeback — auto-revoke commission, mark `status='revoked'`.

## 6. Build phases

**Phase 0 — Schema & migration (no UI)**
- Create `partners`, `referral_attributions`, `commissions`, `payouts`, `partner_invites`; extend `coupons`.
- Backfill `partners` from `promoters` (1:1 by user_id, slug = partner_code).
- Backfill `referral_attributions` from `profiles.partner_code_used` and `purchases.partner_code` where derivable.
- Add `partner_leaderboard` view + RLS policies.
- Add new `app_role`-gated admin RPCs: `admin_reassign_attribution`, `admin_revoke_commission`, `admin_merge_partners`, `admin_adjust_partner_score`.

**Phase 1 — Attribution capture (first-touch, permanent)**
- New `src/lib/attribution.ts` with `captureFromUrl()`, `getAttribution()`, `clearAttribution()`. Cookie (1y+, SameSite=Lax) + localStorage mirror.
- Top-level `?ref=` listener in `App.tsx` (runs on every route) so `/assessment`, `/free-assessment`, `/premium`, `/`, `/p/:slug`, `/invite/:code` all attribute.
- Resolution order: query `partners.slug` first, then `profiles.invite_code`.
- Replace ad-hoc reads in `Assessment.tsx`, `Premium.tsx`, `PartnerSales.tsx`, `InviteEntry.tsx` with the new helper.

**Phase 2 — Bind attribution to user on signup**
- `SignupChat` passes `attribution_partner_slug` + `attribution_source` in user metadata.
- `handle_new_user` (or new trigger) inserts the `referral_attributions` row if absent. Self-referral + cycle guards.
- Auto-create `partners` row for the new user (`status='active'`, slug = invite_code) so every participant is automatically an affiliate.

**Phase 3 — Partner dashboard at `/partner-dashboard`**
- Add route (keep `/promoter` as alias).
- Refactor `usePromoter` → `usePartner` returning attributions count, commissions summary, payout history, referral link.
- Add "Invite partners" panel writing to `partner_invites`.

**Phase 4 — Purchases & commissions**
- `create-checkout`: include `attribution_partner_slug` + `coupon_code` in Stripe metadata.
- `payments-webhook`: on `checkout.session.completed`, look up effective partner (coupon override → user attribution), snapshot commission rule, insert into `commissions` (status `pending`).
- On refund/dispute: set commission `status='revoked'`.
- Admin "approve commission" action flips `pending → approved`.

**Phase 5 — Manual payouts**
- Admin selects approved commissions for a partner → creates a `payouts` row → marks commissions `paid` + stamps `payout_id`.
- Partner dashboard shows pending vs. paid totals.

**Phase 6 — Two-level referrals**
- When attributing a new user to partner P, if P has `parent_partner_id = Q`, also stamp `referral_attributions.parent_partner_id` and credit a (configurable) secondary commission rule on purchase.

**Phase 7 — Leaderboard**
- New `partner_leaderboard` query: `signups + manual_score_adjustment`, ordered desc.
- Admin can adjust score via `admin_adjust_partner_score`.

**Phase 8 — Coupons tied to partners**
- Extend `AdminCoupons` UI: assign coupon to partner with optional commission override.
- `redeem_coupon` returns `partner_id`; checkout passes through to webhook.

**Phase 9 — Admin polish**
- `AdminAttribution`: search, reassign (single or bulk).
- `AdminCommissions`: filter, approve, revoke.
- `AdminPayouts`: create / mark paid / export CSV.
- Partner merge tool with confirmation modal.

## 7. Exact first build prompt to run after plan approval

> **Phase 0 — Schema only.** Implement the database migration for the LEADIO partner system. Create tables `partners`, `referral_attributions`, `commissions`, `payouts`, `partner_invites`; add columns `partner_id`, `commission_type`, `commission_value` to `coupons`. Add enums `partner_status`, `commission_type`, `commission_status`, `payout_status`, `attribution_source`. Enforce one attribution row per user_id. Add RLS: partners can read their own attributions/commissions/payouts; admins (via `has_role`) can read/write all. Backfill `partners` from `promoters` (slug = partner_code, status = is_approved ? 'active' : 'pending', user_id 1:1). Backfill `referral_attributions` from `purchases.partner_code` joined to `partners.slug`. Add admin SECURITY DEFINER functions: `admin_reassign_attribution`, `admin_revoke_commission`, `admin_merge_partners(p_keep uuid, p_remove uuid)`, `admin_adjust_partner_score`. Add view `partner_leaderboard` returning partner, signups count, manual_score_adjustment, total_score. Do NOT change any UI or existing application code in this step.

