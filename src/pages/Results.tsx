import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Shield, Zap, Key, Eye, Share2, ArrowRight } from "lucide-react";

const identityMap: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  hidden_authority: {
    label: "Hidden Authority",
    icon: <Shield className="w-8 h-8 text-primary" />,
    description:
      "Your audience trusts you deeply — but you're not activating that trust. People listen when you speak, yet your growth stays flat because there's no system turning trust into action.",
  },
  unactivated_audience: {
    label: "Unactivated Audience",
    icon: <Eye className="w-8 h-8 text-primary" />,
    description:
      "You have people watching — but they're passive. They scroll, they like, and they leave. Without a clear path, your audience stays spectators instead of participants.",
  },
  momentum_builder: {
    label: "Momentum Builder",
    icon: <Zap className="w-8 h-8 text-accent" />,
    description:
      "You're great at getting things moving — but you don't own the relationship. If your platform disappears, so does your momentum. You need infrastructure under the energy.",
  },
  network_catalyst: {
    label: "Network Catalyst",
    icon: <Key className="w-8 h-8 text-accent" />,
    description:
      "You've built real ownership and clarity — now you need to light the match. Your foundation is solid, but your audience isn't growing because you haven't turned your network into a referral engine.",
  },
};

const dimensionLabels: Record<string, string> = {
  trust: "Trust",
  activation: "Activation",
  ownership: "Ownership",
  clarity: "Clarity",
};

const Results = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const assessment = state.assessment;

  if (!assessment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4">
        <h1 className="text-xl font-bold text-foreground">No results yet</h1>
        <Button onClick={() => navigate("/assess")}>Take the assessment</Button>
      </div>
    );
  }

  const { scores, percentage, identityType } = assessment;
  const identity = identityMap[identityType] || identityMap.unactivated_audience;
  const maxDim = 8; // 2 questions × 4 max each

  const shareText = encodeURIComponent(
    `I scored ${percentage}/100 on the Trust Leverage Assessment — what would you get?`
  );

  return (
    <div className="flex flex-col min-h-screen p-6 pb-24 max-w-lg mx-auto">
      {/* Identity Header */}
      <div className="flex flex-col items-center text-center mb-6 pt-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          {identity.icon}
        </div>
        <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">
          You are a
        </p>
        <h1 className="text-2xl font-bold text-foreground mb-3">{identity.label}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{identity.description}</p>
      </div>

      {/* Tension */}
      <Card className="border-accent/30 bg-accent/5 mb-6">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-foreground leading-relaxed text-center">
            "You're sitting on growth that should already be happening — but without a system, it
            stays stuck."
          </p>
        </CardContent>
      </Card>

      {/* Score */}
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground mb-1">Your trust leverage score</p>
        <p className="text-4xl font-bold text-foreground">
          {percentage}
          <span className="text-lg text-muted-foreground font-normal">/100</span>
        </p>
      </div>

      {/* Dimensions */}
      <Card className="mb-6">
        <CardContent className="p-5 space-y-4">
          {Object.entries(dimensionLabels).map(([key, label]) => {
            const value = scores[key] || 0;
            const pct = Math.round((value / maxDim) * 100);
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground">
                    {value}/{maxDim}
                  </span>
                </div>
                <Progress value={pct} className="h-2.5" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Share */}
      <Button
        variant="outline"
        className="w-full h-12 rounded-xl mb-3 gap-2"
        onClick={() =>
          window.open(`https://twitter.com/intent/tweet?text=${shareText}`, "_blank")
        }
      >
        <Share2 className="w-4 h-4" />
        I scored {percentage}/100 — what would you get?
      </Button>

      {/* CTA */}
      <Button
        className="w-full h-12 text-base rounded-xl gap-2"
        onClick={() => navigate("/join")}
      >
        Join the challenge
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default Results;
