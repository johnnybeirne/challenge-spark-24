import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { setPartnerCode } from "@/lib/partner";

/**
 * /invite/:referralCode
 * Lightweight referral entry. Stores the referral code (reusing partner code
 * storage) and routes the visitor through the canonical funnel:
 *   invite → assessment → results → challenge invite
 */
const InviteEntry = () => {
  const { referralCode = "" } = useParams<{ referralCode: string }>();

  useEffect(() => {
    if (referralCode) {
      try {
        sessionStorage.setItem("leadio_referral_code", referralCode);
      } catch {
        // ignore
      }
      setPartnerCode(referralCode);
    }
  }, [referralCode]);

  return <Navigate to="/assess" replace />;
};

export default InviteEntry;
