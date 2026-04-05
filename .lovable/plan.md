

## JV Partner / Promoter Layer

### What we're building

A distinct **Partner (JV promoter)** role alongside the existing participant layer. Partners get unique codes with a `jv_` prefix, a dedicated dashboard with conversion analytics, and higher reward tiers — incentivizing them to drive volume into the challenge ecosystem.

### Architecture

**Two user types, one system:**

```text
Participant:  invite code "abc12345"  → standard referral rewards
Partner/JV:   invite code "jv_xyz89"  → enhanced rewards + partner dashboard
```

### Changes

**1. Data model updates (`AppContext.tsx`)**

- Add `partner` object to `AppState`:
  ```
  partner: {
    isPartner: boolean;
    partnerCode: string | null;
    partnerSince: string | null;
    conversions: number;        // signups through partner code
    assessmentStarts: number;   // assessment page loads via partner link
    tier: "bronze" | "silver" | "gold";
  }
  ```
- Add a `generatePartnerCode()` function returning `jv_` + 6 alphanumeric chars.
- Persist under `challengeos_partner` localStorage key.

**2. Partner reward tiers (unlock engine)**

Add partner-specific unlock definitions in `checkAndTriggerUnlocks`:

| Conversions | Reward | Value |
|---|---|---|
| 10 | Partner Growth Kit | $197 |
| 25 | Partner Accelerator Pack | $397 |
| 50 | Elite Partner System | $997 |

These are separate from participant milestones (3/5/10).

**3. Partner Dashboard page (`src/pages/PartnerDashboard.tsx`)**

A new route `/partner` showing:
- **Stats cards**: Total conversions, assessment starts, conversion rate, current tier
- **Tier progress bar**: Visual progress toward next tier with milestone markers
- **Conversion log**: Recent signups attributed to the partner code
- **Partner link + share tools**: Reuses `shareOrCopy()` with partner-specific copy: "I'm helping builders launch in 3 days — take the free assessment"
- **Reward milestones**: Checklist similar to Referrals page but with partner tiers

**4. Assessment attribution (`src/pages/Assessment.tsx`)**

- On load, detect `ref` param — if it starts with `jv_`, store as `challengeos_partner_ref` in sessionStorage (separate from regular ref).
- Track assessment start by incrementing partner's `assessmentStarts` on page load.

**5. Signup attribution (`src/pages/Signup.tsx`)**

- Check for both `challengeos_ref` and `challengeos_partner_ref`.
- If partner ref exists, increment the partner's conversion count.
- A signup can be attributed to both a participant referrer AND a partner simultaneously.

**6. Navigation + routing**

- Add `/partner` route in `App.tsx` (auth-guarded).
- Add a "Partner" entry in `BottomNav.tsx` (only shown if `state.partner.isPartner`).
- Add "Become a Partner" CTA card on Community page for eligible users (Builder Circle unlocked).

**7. Partner activation flow**

- Users who have unlocked Builder Circle see a "Become a Partner" card on the Community page.
- Clicking it sets `partner.isPartner = true`, generates a `jv_` code, and navigates to `/partner`.

### Files to create/edit

| File | Action |
|---|---|
| `src/context/AppContext.tsx` | Add partner state, storage key, partner unlocks, `generatePartnerCode()` |
| `src/pages/PartnerDashboard.tsx` | Create — stats, tier progress, conversion log, share tools |
| `src/pages/Assessment.tsx` | Detect `jv_` prefix refs, track assessment starts |
| `src/pages/Signup.tsx` | Dual attribution (participant + partner) |
| `src/pages/Community.tsx` | Add "Become a Partner" CTA for eligible users |
| `src/components/BottomNav.tsx` | Conditionally show Partner tab |
| `src/App.tsx` | Add `/partner` route |

