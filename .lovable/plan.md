# Phase 3 — Partner dashboard on the new tables

## Goal
Move the partner-facing screens off `promoters.conversions` / `assessment_starts` and onto the canonical Phase-0/1/2 tables (`partners`, `referral_attributions`, `commissions`, `payouts`). Keep visual layout familiar; swap the data source and add the missing partner-economy panels (commissions + sub-partners) so Phase 4 has a place to plug into.

## Scope
- Replace data hook for `PartnerDashboard.tsx` and `PartnerPerformance.tsx`.
- New canonical hook: `usePartner` (returns `partners` row + aggregates + sub-partners).
- Stub commission/payout sections — they read from `commissions`/`payouts` (will be empty until Phase 4) but render gracefully.
- Keep `usePromoter` alive only where still needed (e.g. `FoundingPartnerPanel`, `Community`, `AdminPromoters`). Don't refactor those yet.

## Out of scope
- Writing commissions (Phase 4).
- Payout creation UI (Phase 5).
- Leaderboard rewrite (Phase 7).
- Coupon-partner linkage UI (Phase 8).
- Admin polish (Phase 9).
- Migrating the existing `assessment_starts` counter — drop "Impressions / CTR" cards from PartnerPerformance (no longer have that signal once we leave `promoters`).

## Tables read
- `partners` — own row by `auth.uid()` (RLS already allows).
- `referral_attributions` — partners can SELECT rows where `partner_id` or `parent_partner_id` matches their partner ids (RLS already allows).
- `commissions` — partners SELECT own (already allowed); aggregate by status.
- `payouts` — partners SELECT own (already allowed); show pending vs paid totals.
- `profiles` — join attributed users to display names (already public-readable).

No schema or RLS changes needed.

## Build steps

### 1. New hook `src/hooks/usePartner.ts`
Returns:
```ts
{
  loading: boolean;
  partner: PartnersRow | null;            // own row
  shareLink: string;                       // origin + /assess?ref=<slug>
  attributions: AttributionWithProfile[]; // direct (partner_id = me)
  subAttributions: AttributionWithProfile[]; // indirect (parent_partner_id = me)
  totals: {
    direct: number;
    indirect: number;
    network: number;
    pendingCommissionsCents: number;
    paidCommissionsCents: number;
    pendingPayoutCents: number;
  };
  refresh: () => Promise<void>;
}
```
Single combined fetch (parallel queries). One `useEffect` keyed on `user.id`. No realtime in this phase.

### 2. Rewrite `PartnerDashboard.tsx` data layer (UI mostly preserved)
Sections (top to bottom):
- Header — show `partner.display_name || profile.name`, `status` badge, founding badge (still from `promoters` for now).
- **Core metrics** (replaces current 4 cards):
  Direct referrals = `totals.direct` · Indirect = `totals.indirect` · Network = `totals.network` · Pending commission = `formatEur(totals.pendingCommissionsCents)`.
- **Recent referrals** (new) — last 10 rows from `attributions` with name/email-prefix + `first_touch_at` + source badge.
- **Commissions snapshot** (new, placeholder if zero):
  Pending / Approved / Paid totals as 3 mini-stat cards. Empty-state copy: "Commissions will appear here when a referred user purchases."
- **Sub-partners** (new, level-2): list partners whose `parent_partner_id = me.id` with their direct count.
- **Visibility & rewards** — keep, but feed `direct` from new `totals.direct` instead of `promoter.conversions`. Reward milestones unchanged.
- Drop "Estimated reach", "Indirect = direct * 0.4", and "Your exposure" (CTR was fake — remove rather than mislead).
- Actions — copy/share use `shareLink` from `usePartner`. Keep "View Builder Circle" + "View asset performance".

### 3. Rewrite `PartnerPerformance.tsx`
- Drop the simulated 30-day sparklines + simulated "Unlock sources" (pure placeholders).
- Replace top metrics with: Direct referrals · Sub-partner referrals · Pending commissions · Paid commissions.
- Keep "Your asset" + "Visibility status" + "Improve visibility" sections.
- Add **"Referral activity (last 30 days)"** sparkline computed from real `attributions[i].first_touch_at` buckets.

### 4. Auto-create partner row on first dashboard visit
If `auth.uid()` has a `promoters` row but no `partners` row yet (race for users who became promoters before backfill), upsert one using promoter slug. Idempotent. Keeps the screen from showing "Not a partner yet" to legacy users.

### 5. Empty states
- No `partners` row at all → show existing "Not a partner yet" CTA.
- Has partner, no attributions → show "Share your link to start tracking" with copy/share buttons.

## Files touched
- **Create:** `src/hooks/usePartner.ts`
- **Edit:** `src/pages/PartnerDashboard.tsx`, `src/pages/PartnerPerformance.tsx`
- **Untouched (deliberate):** `src/hooks/usePromoter.tsx`, `src/components/FoundingPartnerPanel.tsx`, `src/pages/AdminPromoters.tsx`, `src/pages/Community.tsx`, `src/pages/Leaderboard.tsx`.

## Risks & mitigations
- **Partner can technically see `user_id` of referred users** (existing RLS, intentional). We display only the joined `profiles.name`; never raw email. Mitigation: name fallback "Builder #abcd1234".
- **Empty commissions table** until Phase 4 — UI must look intentional, not broken. Mitigation: explicit empty-state copy.
- **Backfilled partner without slug match** — defensive guard: if `partner.slug` is null, show admin-contact message instead of crashing on share link.
- **Removing fake metrics** (CTR, exposure) may surprise users. Mitigation: replace with honest "real data only" phrasing in copy.

## Verification
- Manual: sign in as a backfilled partner → dashboard shows real referral count from `referral_attributions`.
- Cross-check: count from new `usePartner.totals.direct` should equal `SELECT count(*) FROM referral_attributions WHERE partner_id = me`.
- Idempotent partner-row backfill: visit dashboard twice; only one row created.
- Empty-state: brand-new partner with zero attributions sees the share-link CTA, not the metrics grid.

## Phase 4 hand-off
After this phase, `commissions` reads are wired but always empty. Phase 4 = inside `payments-webhook`, on a paid purchase: look up `referral_attributions` for the buyer; if found, insert a `commissions` row at `partners.default_commission_*`; if `parent_partner_id` is set, insert a level-2 commission too. The dashboard built here will start showing real numbers immediately.
