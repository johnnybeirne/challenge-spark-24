import { useEffect, useState } from "react";

import { Eye, Zap } from "lucide-react";
import { useAppState, defaultState, generateInviteCode } from "@/context/AppContext";
import { SETUP_KEY } from "@/components/Day1Setup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Spinner from "@/components/Spinner";
import AdminTestAccounts, {
  fetchTestAccounts,
  launchViewAsTestAccount,
  type TestAccount,
} from "@/pages/AdminTestAccounts";
import { toast } from "sonner";

const DEMO_USER_KEY = "leadio_view_as_user";
const DEMO_SETUP_RESET_KEY = "leadio_view_as_user_reset_setup";

const safeRedirect = (value: string | null | undefined, fallback: string) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
};

const demoEntryUrl = (redirectTo: string, startDay: 1 | 2 | 3) =>
  `/let-me-in?redirect=${encodeURIComponent(redirectTo)}&day=${startDay}`;

/**
 * Shared helper: drops the current browser session into a fresh in-memory
 * "demo participant" so an admin can preview the challenger experience
 * without signing up. Used by both the auto-redirect route (/let-me-in) and
 * the manual "Launch demo user" button on the combined view-as-user page.
 */
const useLaunchDemoUser = () => {
  const { setState } = useAppState();

  return (redirectTo: string, startDay: 1 | 2 | 3 = 1, openMode: "new-tab" | "same-tab" = "new-tab") => {
    if (openMode === "new-tab") {
      window.open(demoEntryUrl(redirectTo, startDay), "_blank", "noopener,noreferrer");
      return;
    }

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
        // Hardcoded test window: Day 1 = 2 days ago, Day 2 = yesterday, Day 3 = today.
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    window.location.replace(redirectTo);
  };
};

/**
 * Auto-redirect entry. Used by /let-me-in to instantly drop into the demo
 * experience. The owner-console "View as User" page below uses the manual
 * button variant instead.
 */
const AdminViewAsUserAutoLaunch = ({ redirectTo = "/challenge/day-1" }: { redirectTo?: string }) => {
  const launch = useLaunchDemoUser();
  const params = new URLSearchParams(window.location.search);
  const target = safeRedirect(params.get("redirect"), redirectTo);
  const dayParam = Number(params.get("day"));
  const startDay = dayParam === 2 || dayParam === 3 ? dayParam : 1;

  useEffect(() => { launch(target, startDay, "same-tab"); }, [target, startDay]);
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
  const [latest, setLatest] = useState<TestAccount | null>(null);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchTestAccounts().then((accs) => {
      if (cancelled) return;
      const sorted = [...accs].sort(
        (a, b) => new Date(b.signup_at).getTime() - new Date(a.signup_at).getTime(),
      );
      setLatest(sorted[0] ?? null);
    });
    return () => { cancelled = true; };
  }, []);

  const handleQuickLaunch = async () => {
    if (!latest) {
      toast.error("No test accounts yet. Create one below.");
      return;
    }
    setLaunching(true);
    await launchViewAsTestAccount(latest);
    setLaunching(false);
  };

  return (
    <div className="space-y-6 p-6">
      <Card className="border-primary/40 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Quick Launch
          </CardTitle>
          <CardDescription>
            {latest
              ? `Open the most recent test user (${latest.first_name ?? "Test"} ${latest.surname?.[0] ?? ""}. · ${latest.email}) in a new tab on the correct challenge day.`
              : "No test accounts found yet — create one below to enable one-click View as."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" onClick={handleQuickLaunch} disabled={!latest || launching}>
            <Eye className="h-4 w-4 mr-2" />
            {launching ? "Opening…" : latest ? "View as latest test user" : "No test user available"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" /> Demo participant (no signup)
          </CardTitle>
          <CardDescription>
            Drop straight into the challenger experience with a hardcoded backdated window. Great for previewing without creating an account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => launch("/challenger-dashboard")}>
            Launch demo (Dashboard)
          </Button>
          <Button variant="outline" onClick={() => launch("/challenge/day-1", 1)}>
            Launch Day 1
          </Button>
          <Button variant="outline" onClick={() => launch("/challenge/day/2", 2)}>
            Launch Day 2
          </Button>
          <Button variant="outline" onClick={() => launch("/challenge/day/3", 3)}>
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
