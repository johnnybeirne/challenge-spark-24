import { useState } from "react";
import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { shareOrCopy } from "@/lib/share";
import { trackEvent } from "@/lib/analytics";

const Day2InviteNudge = ({ onContinue }: { onContinue: () => void }) => {
  const { state } = useAppState();
  const [dismissed, setDismissed] = useState(false);
  const invites = state.network.direct || 0;

  if (dismissed || invites >= 3) return null;

  const inviteCode = state.user?.inviteCode ?? "";
  const referralLink = `${window.location.origin}/assess${inviteCode ? `?ref=${inviteCode}` : ""}`;

  const handleInvite = () => {
    trackEvent("onboarding_invite_started" as any);
    shareOrCopy({
      text: "I'm building a 3-day audience growth system — want to try it with me?",
      url: referralLink,
    });
  };

  return (
    <Card className="border-accent/30 bg-accent/5 mb-6">
      <CardContent className="p-5 text-center">
        <Rocket className="w-6 h-6 text-accent mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Want to move faster?
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Invite 3 builders and accelerate your progress.
        </p>
        <div className="flex gap-2 justify-center">
          <Button size="sm" onClick={handleInvite}>
            Invite now
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => {
              setDismissed(true);
              onContinue();
            }}
          >
            Continue anyway
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Day2InviteNudge;
