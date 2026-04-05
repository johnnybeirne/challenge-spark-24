import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ArrowRight } from "lucide-react";
import { shareOrCopy } from "@/lib/share";
import { trackEvent } from "@/lib/analytics";
import { useEffect } from "react";

const InviteBuilders = () => {
  const navigate = useNavigate();
  const { state } = useAppState();

  useEffect(() => {
    trackEvent("onboarding_viewed" as any);
  }, []);

  const inviteCode = state.user?.inviteCode ?? "";
  const referralLink = `${window.location.origin}/assess${inviteCode ? `?ref=${inviteCode}` : ""}`;

  const handleInvite = () => {
    trackEvent("onboarding_invite_started" as any);
    shareOrCopy({
      text: "I'm building a 3-day audience growth system — want to try it with me?",
      url: referralLink,
    });
  };

  const handleSkip = () => {
    trackEvent("onboarding_skipped" as any);
    navigate("/dashboard");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <Users className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-3">
          Don't build this alone
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
          The fastest builders don't go solo — they bring others with them.
        </p>
        <p className="text-xs text-muted-foreground mb-8">
          Invite 3 builders now and unlock your first advantage.
        </p>

        <Card className="mb-6">
          <CardContent className="p-5">
            <Button
              className="w-full h-12 text-base rounded-xl gap-2 mb-3"
              onClick={handleInvite}
            >
              <Users className="w-4 h-4" />
              Invite 3 builders
            </Button>
            <Button
              variant="ghost"
              className="w-full text-sm text-muted-foreground"
              onClick={handleSkip}
            >
              Skip for now
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InviteBuilders;
