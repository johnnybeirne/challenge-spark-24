// Canonical Leadio user role + permission system.
//
// One source of truth for "what kind of user is this and what should they see".
// This module is PURE — no React, no Supabase. The `useUserRole` hook composes
// existing hooks (useAuth, useUserStage, usePremium, usePromoter, has_role RPC)
// and feeds the result into the helpers here.
//
// Precedence (highest wins): admin > partner > premium_user > challenger > free_student > visitor.
//
// Do NOT use this to gate critical business logic (scoring, unlocks, payments).
// Source of truth for those remains: AppContext, scoring.ts, premium.ts, RLS.
// This layer is for CTA hierarchy, navigation visibility, and conditional UI.

export type LeadioRole =
  | "visitor"
  | "free_student"
  | "challenger"
  | "premium_user"
  | "partner"
  | "admin";

export type RolePermissions = {
  // Navigation surfaces
  canSeeBottomNav: boolean;
  canSeeBlueprintSidebar: boolean;
  canSeeChallengeSidebar: boolean;
  canSeePartnerNav: boolean;
  canSeeAdminConsole: boolean;

  // Content access (UI-level; RLS still enforces server-side)
  canAccessAssessment: boolean;
  canAccessBlueprintFreeModules: boolean;
  canAccessChallengeDays: boolean;
  canAccessPremiumModules: boolean;
  canAccessPartnerDashboard: boolean;
  canAccessBuilderCircle: boolean; // visibility only — unlock rules still apply

  // CTA / monetisation visibility
  showUpgradePrompts: boolean;
  showChallengeGamification: boolean;
  showReferralTools: boolean;
  showPartnerInvite: boolean;

  // Stage label for UI
  roleLabel: string;
};

export type RoleCta = { label: string; href: string };

const BASE: RolePermissions = {
  canSeeBottomNav: false,
  canSeeBlueprintSidebar: false,
  canSeeChallengeSidebar: false,
  canSeePartnerNav: false,
  canSeeAdminConsole: false,
  canAccessAssessment: true, // public
  canAccessBlueprintFreeModules: false,
  canAccessChallengeDays: false,
  canAccessPremiumModules: false,
  canAccessPartnerDashboard: false,
  canAccessBuilderCircle: false,
  showUpgradePrompts: false,
  showChallengeGamification: false,
  showReferralTools: false,
  showPartnerInvite: false,
  roleLabel: "Visitor",
};

export const ROLE_PERMISSIONS: Record<LeadioRole, RolePermissions> = {
  visitor: { ...BASE, roleLabel: "Visitor" },

  free_student: {
    ...BASE,
    canSeeBlueprintSidebar: true,
    canAccessBlueprintFreeModules: true,
    showReferralTools: true, // can invite, unlock bonus resources
    showUpgradePrompts: true, // soft prompt to enter challenge
    roleLabel: "Free Student",
  },

  challenger: {
    ...BASE,
    canSeeBottomNav: true,
    canSeeChallengeSidebar: true,
    canSeeBlueprintSidebar: true, // can still revisit blueprint
    canAccessBlueprintFreeModules: true,
    canAccessChallengeDays: true,
    canAccessBuilderCircle: true,
    showChallengeGamification: true,
    showReferralTools: true,
    showUpgradePrompts: true, // upgrade to VIP
    roleLabel: "Challenger",
  },

  premium_user: {
    ...BASE,
    canSeeBottomNav: true,
    canSeeChallengeSidebar: true,
    canSeeBlueprintSidebar: true,
    canAccessBlueprintFreeModules: true,
    canAccessChallengeDays: true,
    canAccessPremiumModules: true,
    canAccessBuilderCircle: true,
    showChallengeGamification: true,
    showReferralTools: true,
    showPartnerInvite: true,
    showUpgradePrompts: false, // already premium — never upsell
    roleLabel: "Premium",
  },

  partner: {
    ...BASE,
    canSeePartnerNav: true,
    canSeeBlueprintSidebar: true,
    canSeeChallengeSidebar: true,
    canAccessBlueprintFreeModules: true,
    canAccessChallengeDays: true,
    canAccessPremiumModules: true, // partners typically have access
    canAccessPartnerDashboard: true,
    canAccessBuilderCircle: true,
    showReferralTools: true,
    showPartnerInvite: true,
    showUpgradePrompts: false,
    roleLabel: "Partner",
  },

  admin: {
    ...BASE,
    canSeeBottomNav: true,
    canSeeBlueprintSidebar: true,
    canSeeChallengeSidebar: true,
    canSeePartnerNav: true,
    canSeeAdminConsole: true,
    canAccessAssessment: true,
    canAccessBlueprintFreeModules: true,
    canAccessChallengeDays: true,
    canAccessPremiumModules: true,
    canAccessPartnerDashboard: true,
    canAccessBuilderCircle: true,
    showChallengeGamification: true,
    showReferralTools: true,
    showPartnerInvite: true,
    showUpgradePrompts: false,
    roleLabel: "Admin",
  },
};

export const ROLE_PRIMARY_CTA: Record<LeadioRole, RoleCta> = {
  visitor:      { label: "Join Free Training",       href: "/blueprint/join" },
  free_student: { label: "Take the Challenge",       href: "/challenge/join" },
  challenger:   { label: "Unlock VIP Training",      href: "/premium" },
  premium_user: { label: "Invite Others",            href: "/referrals" },
  partner:      { label: "Promote the Challenge",    href: "/promoter" },
  admin:        { label: "Open Owner Console",       href: "/owner-console" },
};

/**
 * Derive the canonical role from raw signals.
 * Precedence: admin > partner > premium_user > challenger > free_student > visitor.
 *
 * Inputs are intentionally minimal so this stays pure & testable.
 */
export function deriveLeadioRole(input: {
  hasUser: boolean;
  isAdmin: boolean;
  isApprovedPromoter: boolean;
  isPremium: boolean;
  hasEnteredChallenge: boolean;
  hasBlueprintAccount: boolean; // any signed-in user has blueprint access
}): LeadioRole {
  if (!input.hasUser) return "visitor";
  if (input.isAdmin) return "admin";
  if (input.isApprovedPromoter) return "partner";
  if (input.isPremium) return "premium_user";
  if (input.hasEnteredChallenge) return "challenger";
  if (input.hasBlueprintAccount) return "free_student";
  return "visitor";
}
