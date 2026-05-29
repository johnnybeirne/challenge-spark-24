import { useEffect } from "react";

import { Eye } from "lucide-react";
import { useAppState, defaultState, generateInviteCode } from "@/context/AppContext";
import { SETUP_KEY } from "@/components/Day1Setup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Spinner from "@/components/Spinner";
import AdminTestAccounts from "@/pages/AdminTestAccounts";

const DEMO_USER_KEY = "leadio_view_as_user";
const DEMO_SETUP_RESET_KEY = "leadio_view_as_user_reset_setup";

/**
 * Shared helper: drops the current browser session into a fresh in-memory
 * "demo participant" so an admin can preview the challenger experience
 * without signing up. Used by both the auto-redirect route (/let-me-in) and
 * the manual "Launch demo user" button on the combined view-as-user page.
 */
const useLaunchDemoUser = () => {
  const { setState } = useAppState();

  return (redirectTo: string, startDay: 1 | 2 | 3 = 1) => {
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
      challenge: {
        ...defaultState.challenge,
        currentDay: startDay,
        // Backdate so earlier days appear complete and the countdown reflects elapsed time.
        startedAt: new Date(Date.now() - (startDay - 1) * 24 * 60 * 60 * 1000).toISOString(),
        endsAt: new Date(Date.now() + (4 - startDay) * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    window.open(redirectTo, "_blank", "noopener,noreferrer");
  };
};

/**
 * Auto-redirect entry. Used by /let-me-in to instantly drop into the demo
 * experience. The owner-console "View as User" page below uses the manual
 * button variant instead.
 */
const AdminViewAsUserAutoLaunch = ({ redirectTo = "/challenge/day-1" }: { redirectTo?: string }) => {
  const launch = useLaunchDemoUser();
  useEffect(() => { launch(redirectTo); }, [redirectTo]);
  return <Spinner />;
};

/**
 * Combined admin page: manual "launch demo user" trigger AND the full
 * test-accounts management UI below, so admins have one place to preview
 * the user experience (either as a generic demo participant or as a real
 * backdated test account).
 */
const AdminViewAsUserPage = () => {
  const launch = useLaunchDemoUser();

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" /> View as User
          </CardTitle>
          <CardDescription>
            Launch a quick demo participant session, or use a real backdated
            test account below to preview the experience as it appears on a
            specific day of the challenge.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => launch("/challenger-dashboard")}>
            Launch demo (Dashboard)
          </Button>
          <Button variant="outline" onClick={() => launch("/challenge/day-1")}>
            Launch Day 1
          </Button>
          <Button variant="outline" onClick={() => launch("/challenge/day-2")}>
            Launch Day 2
          </Button>
          <Button variant="outline" onClick={() => launch("/challenge/day-3")}>
            Launch Day 3
          </Button>
        </CardContent>
      </Card>

      <AdminTestAccounts />
    </div>
  );
};

export { DEMO_USER_KEY, DEMO_SETUP_RESET_KEY };
export { AdminViewAsUserAutoLaunch };
export default AdminViewAsUserPage;
