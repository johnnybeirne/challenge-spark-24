import { useEffect, useState } from "react";
import { isPremiumUser, getAppliedCoupon, PREMIUM_CHANGED_EVENT } from "@/lib/premium";

export const usePremium = () => {
  const [premium, setPremiumState] = useState<boolean>(() => isPremiumUser());
  const [coupon, setCoupon] = useState<string | null>(() => getAppliedCoupon());

  useEffect(() => {
    const update = () => {
      setPremiumState(isPremiumUser());
      setCoupon(getAppliedCoupon());
    };
    window.addEventListener(PREMIUM_CHANGED_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(PREMIUM_CHANGED_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return { isPremium: premium, coupon };
};
