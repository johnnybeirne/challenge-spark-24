import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, ArrowRight } from "lucide-react";
import { shareOrCopy } from "@/lib/share";
import { trackEvent } from "@/lib/analytics";
import {
  styleLabels,
  styleIcons,
  type AssessmentResult,
} from "@/lib/assessmentData";

/* ── Trust Leverage scoring (derived from existing answers) ── */
type Dimensions = {
  clarity: number;
  audience: number;
  system: number;
  momentum: number;
};

function calculateTrustLeverage(a: Record<string, string>): { score: number; dims: Dimensions } {
  // Clarity — q3 (what you help with) + q6 (frustration = clarity?)
  const clarityMap: Record<string, number> = { strategy: 80, services: 85, coaching: 80, content: 75, undefined: 35 };
  let clarity = clarityMap[a.q3] ?? 50;
  if (a.q6 === "clarity") clarity -= 15;

  // Audience — q4 size
  const audienceMap: Record<string, number> = { starting: 35, small: 60, growing: 80, established: 95 };
  const audience = audienceMap[a.q4] ?? 50;

  // System — q5 lead source predictability + q6 if leads/consistency block
  const systemMap: Record<string, number> = { referrals: 60, content: 75, ads: 70, inconsistent: 30 };
  let system = systemMap[a.q5] ?? 50;
  if (a.q6 === "leads" || a.q6 === "consistency") system -= 10;

  // Momentum — q7 readiness + q8 share intent
  const readyMap: Record<string, number> = { ready: 95, almost: 75, exploring: 50, curious: 30 };
  const shareMap: Record<string, number> = { very_likely: 100, likely: 80, maybe: 50, unlikely: 25 };
  const momentum = Math.round(((readyMap[a.q7] ?? 50) + (shareMap[a.q8] ?? 50)) / 2);

  const dims: Dimensions = {
    clarity: Math.max(5, Math.min(100, Math.round(clarity))),
    audience: Math.max(5, Math.min(100, Math.round(audience))),
    system: Math.max(5, Math.min(100, Math.round(system))),
    momentum: Math.max(5, Math.min(100, Math.round(momentum))),
  };
  const score = Math.round((dims.clarity + dims.audience + dims.system + dims.momentum) / 4);
  return { score, dims };
}

const identityDescriptions: Record<string, string> = {
  quick_win: "You should build a quick-win AI-powered challenge app — fast, tangible results that prove value in minutes.",
  transformation: "You should build a transformation AI-powered challenge app — guiding users through deep change they remember and share.",
  skill_builder: "You should build a skill-building AI-powered challenge app — teaching real capability with each step.",
  launch: "You should build a launch AI-powered challenge app — helping users ship something real by the end.",
};

const Results = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const assessment = state.assessment as unknown as AssessmentResult | null;
  const hasResult = !!assessment && "challengeType" in (assessment as object);

  const { score, dims } = useMemo(
    () => calculateTrustLeverage(hasResult ? assessment!.answers : {}),
    [hasResult, assessment]
  );

  if (!hasResult || !assessment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4">
        <h1 className="text-xl font-bold text-foreground">No results yet</h1>
        <Button onClick={() => navigate("/assess")}>Take the assessment</Button>
      </div>
    );
  }

  const { challengeType } = assessment;
  const icon = styleIcons[challengeType];
  const label = styleLabels[challengeType];
  const description = identityDescriptions[challengeType];

  const inviteCode = state.user?.inviteCode ?? "";
  const referralLink = `${window.location.origin}/assess${inviteCode ? `?ref=${inviteCode}` : ""}`;
  const shareText = `I scored ${score}/100 — what would you get?`;

  const handleShare = () => {
    trackEvent("assessment_result_shared" as any);
    shareOrCopy({ text: shareText, url: referralLink });
  };

  const dimensionList: { key: keyof Dimensions; label: string }[] = [
    { key: "clarity", label: "Clarity" },
    { key: "audience", label: "Audience" },
    { key: "system", label: "System" },
    { key: "momentum", label: "Momentum" },
  ];

  return (
    <div className="flex flex-col min-h-screen p-6 pb-24 max-w-6xl mx-auto sm:px-6 lg:px-8">
      {/* ── Header: icon + identity type + description ── */}
      <div className="flex flex-col items-center text-center mb-6 pt-4">
        <div className="text-5xl mb-3">{icon}</div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Your identity</p>
        <h1 className="text-2xl font-bold text-foreground mb-2">{label}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">{description}</p>
      </div>

      {/* ── Tension ── */}
      <Card className="mb-5 border-accent/30 bg-accent/5">
        <CardContent className="p-5">
          <p className="text-sm text-foreground leading-relaxed italic">
            "You're sitting on growth that should already be happening — but without a system, it stays stuck."
          </p>
        </CardContent>
      </Card>

      {/* ── Score ── */}
      <Card className="mb-5 border-primary/20 bg-primary/5">
        <CardContent className="p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Your trust leverage score
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-bold text-primary">{score}</span>
            <span className="text-xl font-medium text-muted-foreground">/100</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Dimensions: 4 bars ── */}
      <Card className="mb-5">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Your dimensions
          </h3>
          {dimensionList.map(({ key, label: dimLabel }) => (
            <div key={key} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">{dimLabel}</span>
                <span className="text-muted-foreground tabular-nums">{dims[key]}/100</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${dims[key]}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Share ── */}
      <Button variant="outline" className="w-full h-12 rounded-xl mb-3 gap-2" onClick={handleShare}>
        <Share2 className="w-4 h-4" />
        I scored {score}/100 — what would you get?
      </Button>

      {/* ── CTA ── */}
      <Button className="w-full h-[52px] text-base rounded-xl gap-2" onClick={() => navigate("/join")}>
        Join the challenge
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default Results;
