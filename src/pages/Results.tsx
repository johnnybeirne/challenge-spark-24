import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Share2, ArrowRight, RotateCcw } from "lucide-react";
import { shareOrCopy } from "@/lib/share";
import { trackEvent } from "@/lib/analytics";
import {
  styleLabels,
  styleIcons,
  b2bStyleContent,
  b2cStyleContent,
  type ChallengeStyle,
  type AudienceType,
} from "@/lib/assessmentData";

const allStyles: ChallengeStyle[] = ["quick_win", "transformation", "skill_builder", "launch"];

const Results = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const assessment = state.assessment;

  if (!assessment || !("audienceType" in assessment)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4">
        <h1 className="text-xl font-bold text-foreground">No results yet</h1>
        <Button onClick={() => navigate("/assess")}>Take the assessment</Button>
      </div>
    );
  }

  const { audienceType, recommended, scores, confidence } = assessment as {
    audienceType: AudienceType;
    recommended: ChallengeStyle;
    scores: Record<ChallengeStyle, number>;
    confidence: string;
  };

  const isB2B = audienceType === "b2b";
  const content = isB2B ? b2bStyleContent[recommended] : b2cStyleContent[recommended];
  const audienceLabel = isB2B ? "B2B audiences" : "consumers";

  const confidenceText =
    confidence === "strong"
      ? "This is a clear fit for your expertise."
      : confidence === "moderate"
      ? "This is a strong match for how you work."
      : "You have range — we recommend starting here because it's the fastest path to leads.";

  const tensionText = isB2B
    ? "You now know what to build. In 3 days, you'll have a live challenge app that generates qualified B2B leads — with a diagnostic assessment, daily tasks, referral mechanics, and email capture. Evergreen and automatic."
    : "You now know what to build. In 3 days, you'll have a live challenge app that generates leads — with a quiz entry point, daily tasks, referral mechanics, and email capture. Evergreen and automatic.";

  const shareText = `I'm building a ${styleLabels[recommended]} for ${isB2B ? "B2B" : "consumers"} — what would you build?`;
  const inviteCode = state.user?.inviteCode ?? "";
  const referralLink = `${window.location.origin}/assess${inviteCode ? `?ref=${inviteCode}` : ""}`;

  const handleShare = () => {
    trackEvent("assessment_result_shared" as any);
    shareOrCopy({ text: shareText, url: referralLink });
  };

  return (
    <div className="flex flex-col min-h-screen p-6 pb-24 max-w-lg mx-auto">
      {/* Identity Header */}
      <div className="flex flex-col items-center text-center mb-6 pt-4">
        <div className="text-5xl mb-3">{styleIcons[recommended]}</div>
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-foreground">{styleLabels[recommended]}</h1>
          <Badge variant="outline" className="text-xs">{isB2B ? "B2B" : "B2C"}</Badge>
        </div>
        <p className="text-sm font-medium text-primary mb-3">
          You should build a {styleLabels[recommended]} for {audienceLabel}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">{content.framing}</p>
      </div>

      {/* Confidence */}
      <Card className="border-accent/30 bg-accent/5 mb-6">
        <CardContent className="p-4 text-center">
          <p className="text-sm font-medium text-foreground">{confidenceText}</p>
        </CardContent>
      </Card>

      {/* Score breakdown */}
      <Card className="mb-6">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Score breakdown</h3>
          {allStyles.map((style) => {
            const value = scores[style] || 0;
            const pct = Math.round((value / 8) * 100);
            const isTop = style === recommended;
            return (
              <div key={style}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <span>{styleIcons[style]}</span> {styleLabels[style]}
                    {isTop && <Badge className="text-[10px] ml-1">Recommended</Badge>}
                  </span>
                  <span className="text-xs text-muted-foreground">{value}/8</span>
                </div>
                <Progress value={pct} className="h-2.5" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* What you'll build */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-2">Here's what you'll build in 3 days</h3>
          <p className="text-xs text-muted-foreground mb-3">
            An evergreen challenge app with everything you need to generate {isB2B ? "B2B leads" : "leads"} automatically:
          </p>
          <ul className="space-y-2 text-sm text-foreground">
            <li className="flex gap-2">
              <span>✓</span>
              <span>A quiz that attracts {isB2B ? "decision-makers" : "your audience"} — a short diagnostic they take, get a personalised result, and share with {isB2B ? "colleagues" : "friends"}</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>A multi-day challenge — structured daily tasks that deliver a real {isB2B ? "business outcome" : "outcome"} and build trust</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Built-in referrals — participants invite others to unlock rewards, so your challenge grows itself</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Email capture — every quiz taker and challenge participant becomes a lead</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Examples */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Here's what yours could look like</h3>
          <div className="space-y-3">
            {content.examples.map((ex, i) => (
              <div key={i} className="bg-background rounded-lg p-3 border border-border">
                <p className="text-sm font-medium text-foreground">{ex.challenge}</p>
                <p className="text-xs text-muted-foreground mt-1">Quiz: "{ex.quiz}"</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tension */}
      <Card className="border-accent/30 bg-accent/5 mb-6">
        <CardContent className="p-4">
          <p className="text-sm text-foreground leading-relaxed text-center">{tensionText}</p>
        </CardContent>
      </Card>

      {/* Share */}
      <Button variant="outline" className="w-full h-12 rounded-xl mb-3 gap-2" onClick={handleShare}>
        <Share2 className="w-4 h-4" />
        {shareText}
      </Button>

      {/* CTA */}
      <Button className="w-full h-12 text-base rounded-xl gap-2 mb-3" onClick={() => navigate("/join")}>
        Start building your challenge
        <ArrowRight className="w-4 h-4" />
      </Button>

      {/* Retake */}
      <Button variant="ghost" className="w-full gap-2 text-muted-foreground" onClick={() => {
        trackEvent("assessment_retaken" as any);
        navigate("/assess");
      }}>
        <RotateCcw className="w-4 h-4" />
        Retake assessment
      </Button>
    </div>
  );
};

export default Results;
