// Canonical Leadio user-role hook.
//
// Composes existing hooks (no DB changes, no replacement of useUserState /
// useUserStage / usePremium / usePartner). Returns a single role +
// permissions object so components stop reinventing role checks.
//
// Use this for: CTA labels, navigation visibility, conditional UI.
// Do NOT use this for: scoring, unlock logic, payments, RLS-equivalent gates.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserStage } from "@/hooks/useUserStage";
import { usePremium } from "@/hooks/usePremium";
import { usePromoter } from "@/hooks/usePromoter";
import {
  ROLE_PERMISSIONS,
  ROLE_PRIMARY_CTA,
  deriveLeadioRole,
  type LeadioRole,
  type RoleCta,
  type RolePermissions,
} from "@/lib/userRole";

// Module-level cache so we don't hammer has_role on every render across hooks.
const adminCache = new Map<string, boolean>();

export type UseUserRoleResult = {
  role: LeadioRole;
  permissions: RolePermissions;
  primaryCta: RoleCta;
  /** True until the admin/partner async checks have resolved. */
  loading: boolean;
  // Convenience flags (read directly from `permissions` when possible)
  isVisitor: boolean;
  isFreeStudent: boolean;
  isChallenger: boolean;
  isPremiumUser: boolean;
  isPartner: boolean;
  isAdmin: boolean;
};

export function useUserRole(): UseUserRoleResult {
  const { user } = useAuth();
  const stage = useUserStage();
  const isOwnerConsoleRoute = typeof window !== "undefined" && (
    window.location.pathname === "/owner-console" ||
    window.location.pathname.startsWith("/owner-console/") ||
    window.location.pathname === "/admin" ||
    window.location.pathname.startsWith("/admin/")
  );
  const { isPremium } = usePremium(!isOwnerConsoleRoute);
  const { promoter, loading: promoterLoading } = usePromoter(!isOwnerConsoleRoute);

  const [isAdmin, setIsAdmin] = useState<boolean>(() =>
    user ? adminCache.get(user.id) ?? false : false
  );
  const [adminChecked, setAdminChecked] = useState<boolean>(() =>
    user ? adminCache.has(user.id) : true
  );

  useEffect(() => {
    if (!user || isOwnerConsoleRoute) {
      setIsAdmin(false);
      setAdminChecked(true);
      return;
    }
    if (adminCache.has(user.id)) {
      setIsAdmin(adminCache.get(user.id)!);
      setAdminChecked(true);
      return;
    }
    let cancelled = false;
    setAdminChecked(false);
    (async () => {
      try {
        const { data } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });
        if (cancelled) return;
        const result = !!data;
        adminCache.set(user.id, result);
        setIsAdmin(result);
      } catch {
        if (cancelled) return;
        adminCache.set(user.id, false);
        setIsAdmin(false);
      } finally {
        if (!cancelled) setAdminChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isOwnerConsoleRoute]);

  return useMemo(() => {
    const role = deriveLeadioRole({
      hasUser: stage.hasUser,
      isAdmin,
      isApprovedPromoter: !!promoter?.is_approved,
      isPremium,
      hasEnteredChallenge: stage.hasEnteredChallenge,
      hasBlueprintAccount: stage.hasUser,
    });

    const permissions = ROLE_PERMISSIONS[role];
    const primaryCta = ROLE_PRIMARY_CTA[role];

    return {
      role,
      permissions,
      primaryCta,
      loading: !adminChecked || promoterLoading,
      isVisitor: role === "visitor",
      isFreeStudent: role === "free_student",
      isChallenger: role === "challenger",
      isPremiumUser: role === "premium_user",
      isPartner: role === "partner",
      isAdmin: role === "admin",
    };
  }, [stage.hasUser, stage.hasEnteredChallenge, isAdmin, adminChecked, isPremium, promoter, promoterLoading]);
}
