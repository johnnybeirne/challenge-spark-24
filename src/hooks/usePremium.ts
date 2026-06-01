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
  const userId = user?.id ?? null;
  const [premium, setPremiumState] = useState<boolean>(() => isPremiumUser());
  const [coupon, setCoupon] = useState<string | null>(() => getAppliedCoupon());

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      await fetchPremiumFromSupabase(userId);
      if (cancelled) return;
      setPremiumState(isPremiumUser());
      setCoupon(getAppliedCoupon());
    };

    // Initial load
    refresh();

    // Refresh whenever auth state changes (login / logout / token refresh)
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    const onLocal = () => {
      setPremiumState(isPremiumUser());
      setCoupon(getAppliedCoupon());
    };
    window.addEventListener(PREMIUM_CHANGED_EVENT, onLocal);

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      window.removeEventListener(PREMIUM_CHANGED_EVENT, onLocal);
    };
  }, [userId]);

  return { isPremium: premium, coupon };
};
