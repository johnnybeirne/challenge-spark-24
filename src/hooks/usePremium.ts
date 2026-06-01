import { useEffect, useState } from "react";
import {
  isPremiumUser,
  getAppliedCoupon,
  fetchPremiumFromSupabase,
  PREMIUM_CHANGED_EVENT,
} from "@/lib/premium";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const usePremium = () => {
  const { user } = useAuth();
  const [premium, setPremiumState] = useState<boolean>(() => isPremiumUser());
  const [coupon, setCoupon] = useState<string | null>(() => getAppliedCoupon());

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      await fetchPremiumFromSupabase(user?.id ?? null);
      if (cancelled) return;
      setPremiumState(isPremiumUser());
      setCoupon(getAppliedCoupon());
    };

    // Initial load
    refresh();

    const onLocal = () => {
      setPremiumState(isPremiumUser());
      setCoupon(getAppliedCoupon());
    };
    window.addEventListener(PREMIUM_CHANGED_EVENT, onLocal);

    return () => {
      cancelled = true;
      window.removeEventListener(PREMIUM_CHANGED_EVENT, onLocal);
    };
  }, [user?.id]);

  return { isPremium: premium, coupon };
};
