import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, ArrowRight, RotateCcw } from "lucide-react";
import { shareOrCopy } from "@/lib/share";
import { trackEvent } from "@/lib/analytics";
import {
  styleLabels,
  styleIcons,
  audienceLabels,
  type AssessmentResult,
  type ChallengeType,
} from "@/lib/assessmentData";

const Results = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const assessment = state.assessment as AssessmentResult | null;

  if (!assessment || !("challengeType" in assessment)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4">
        <h1 className="text-xl font-bold text-foreground">No results yet</h1>
        <Button onClick={() => navigate("/assess")}>Take the assessment</Button>
      </div>
    );
  }

  const {
    audienceType,
    challengeType,
    readinessLevel,
    growthBlock,
    recommendedChallenge,
    messagingAngle,
    growthInsight,
  } = assessment;

  const icon = styleIcons[challengeType];
  const label = styleLabels[challengeType];
  const audienceLabel = audienceLabels[audienceType];

  const readinessText =
    readinessLevel === "high"
      ? "You're ready to start building right now."
      : readinessLevel === "medium"
      ? "You're almost there — this challenge will close the gap."
      : "This is the perfect way to explore and find your direction.";

  const inviteCode = state.user?.inviteCode ?? "";
  const referralLink = `${window.location.origin}/assess${inviteCode ? `?ref=${inviteCode}` : ""}`;
  const shareText = `I'm building a ${label} challenge for ${audienceLabel} — what would you build?`;

  const handleShare = () => {
    trackEvent("assessment_result_shared" as any);
    shareOrCopy({ text: shareText, url: referralLink });
  };

  return (
    <div className="flex flex-col min-h-screen p-6 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-6 pt-4">
        <div className="text-5xl mb-3">{icon}</div>
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-foreground">{label}</h1>
          <Badge variant="outline" className="text-xs">{audienceLabel}</Badge>
        </div>
        <p className="text-sm font-medium text-primary">{readinessText}</p>
      </div>

      {/* Recommended Challenge */}
      <Card className="mb-5 border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <h3 className="text-lg font-bold text-foreground mb-2">{recommendedChallenge.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{recommendedChallenge.description}</p>
          <div className="bg-background border border-border rounded-lg p-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Outcome</p>
            <p className="text-sm text-foreground">{recommendedChallenge.outcome}</p>
          </div>
        </CardContent>
      </Card>

      {/* Messaging Angle */}
      <Card className="mb-5">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your messaging angle</h3>
          <p className="text-sm text-foreground leading-relaxed">{messagingAngle}</p>
        </CardContent>
      </Card>

      {/* Growth Insight */}
      <Card className="mb-5 border-accent/30 bg-accent/5">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Growth insight</h3>
          <p className="text-sm text-foreground leading-relaxed">{growthInsight}</p>
        </CardContent>
      </Card>

      {/* What you'll build */}
      <Card className="mb-5">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Here's what you'll build in 3 days</h3>
          <ul className="space-y-2 text-sm text-foreground">
            <li className="flex gap-2">
              <span className="text-primary">✓</span>
              <span>A quiz that attracts {audienceType === "b2b" ? "decision-makers" : "your ideal audience"}</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">✓</span>
              <span>A multi-day challenge that builds trust through real outcomes</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">✓</span>
              <span>Built-in referrals — participants invite others, so it grows itself</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">✓</span>
              <span>Email capture on every quiz taker and participant</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Share */}
      <Button variant="outline" className="w-full h-12 rounded-xl mb-3 gap-2" onClick={handleShare}>
        <Share2 className="w-4 h-4" />
        Share my result
      </Button>

      {/* CTA */}
      <Button className="w-full h-[52px] text-base rounded-xl gap-2 mb-3" onClick={() => navigate("/join")}>
        Start building your challenge
        <ArrowRight className="w-4 h-4" />
      </Button>

      {/* Retake */}
      <Button
        variant="ghost"
        className="w-full gap-2 text-muted-foreground"
        onClick={() => {
          trackEvent("assessment_retaken" as any);
          navigate("/assess");
        }}
      >
        <RotateCcw className="w-4 h-4" />
        Retake assessment
      </Button>
    </div>
  );
};

export default Results;
