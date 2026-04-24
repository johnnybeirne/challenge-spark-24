import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState, defaultState, generateInviteCode } from "@/context/AppContext";
import { SETUP_KEY } from "@/components/Day1Setup";
import Spinner from "@/components/Spinner";

const DEMO_USER_KEY = "leadio_view_as_user";
const DEMO_SETUP_RESET_KEY = "leadio_view_as_user_reset_setup";

const AdminViewAsUser = () => {
  const { setState } = useAppState();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      sessionStorage.setItem(DEMO_USER_KEY, "1");
      sessionStorage.setItem(DEMO_SETUP_RESET_KEY, "1");
      localStorage.removeItem(SETUP_KEY);
    } catch {}

    setState({
      ...defaultState,
      user: {
        name: "John",
        email: "demo@leadio.local",
        inviteCode: generateInviteCode(),
        referredBy: null,
        role: "participant",
        joinedAt: new Date().toISOString(),
        isFoundingPartner: false,
        foundingPartnerRank: null,
        foundingPartnerJoinedAt: null,
        isEligibleForPromotion: false,
        qualityScore: 0,
        adminBoost: 0,
        adminBadge: null,
        submittedUrl: null,
      },
    });

    navigate("/day/1", { replace: true });
  }, [navigate, setState]);

  return <Spinner />;
};

export { DEMO_USER_KEY, DEMO_SETUP_RESET_KEY };
export default AdminViewAsUser;