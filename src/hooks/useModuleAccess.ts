// Canonical access check for blueprint modules.
// Free-tier definition: entryIntent === "free_training" OR user is not premium.
// Modules 1-3: free. Modules 4+: premium-only AND not on the free_training funnel.

import { usePremium } from "@/hooks/usePremium";
import { getEntryIntent } from "@/lib/entryIntent";

const FREE_MODULES = new Set([1, 2, 3]);

export const PREMIUM_LOCK_TITLE = "Premium Module Locked";
export const PREMIUM_LOCK_MESSAGE =
  "This module is part of the premium Leadio growth system. Upgrade to unlock Advanced Challenge Systems, Scaling With Leadio, AI implementation systems, and advanced referral mechanics.";
export const PREMIUM_LOCK_CTA = "Unlock Premium";

export const isModulePremium = (moduleNumber: number) =>
  !FREE_MODULES.has(moduleNumber);

export const useModuleAccess = (moduleNumber: number) => {
  const { isPremium } = usePremium();
  const intent = getEntryIntent();
  const isFreeTraining = intent === "free_training";
  const premiumModule = isModulePremium(moduleNumber);

  // Free-tier = on the free_training funnel OR has no premium flag.
  const isFreeTier = isFreeTraining || !isPremium;

  // Premium modules require: premium flag AND not on free_training funnel.
  const allowed = !premiumModule || (isPremium && !isFreeTraining);

  return {
    allowed,
    isPremiumModule: premiumModule,
    isFreeTier,
    isPremium,
    isFreeTraining,
  };
};
