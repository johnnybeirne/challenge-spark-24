import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";
import { shareOrCopy } from "@/lib/share";
import { trackEvent } from "@/lib/analytics";

const InviteNudgeCard = () => {
  const { state } = useAppState();
  const invites = state.network.direct || 0;
  const target = 3;
  const remaining = Math.max(0, target - invites);
  const pct = Math.min(100, Math.round((invites / target) * 100));

  const inviteCode = state.user?.inviteCode ?? "";
  const referralLink = `${window.location.origin}/assess${inviteCode ? `?ref=${inviteCode}` : ""}`;

  if (invites >= target) return null;

  const handleInvite = () => {
    trackEvent("onboarding_invite_started" as any);
    shareOrCopy({
      text: "I'm building a 3-day audience growth system — want to try it with me?",
      url: referralLink,
    });
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <Users className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              Grow faster with your network
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You're {remaining} invite{remaining !== 1 ? "s" : ""} away from unlocking your next advantage.
            </p>
          </div>
        </div>
        <Progress value={pct} className="h-2 mb-3" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{invites} / {target} invites</span>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleInvite}>
            Invite builders
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InviteNudgeCard;
