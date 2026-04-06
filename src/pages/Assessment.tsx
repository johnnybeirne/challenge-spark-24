import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowRight } from "lucide-react";
import {
  splitQuestion,
  b2bQuestions,
  b2cQuestions,
  scoreAssessment,
  type AudienceType,
  type ChallengeStyle,
} from "@/lib/assessmentData";

const REF_SESSION_KEY = "challengeos_ref";
const TOTAL_QUESTIONS = 9;

const Assessment = () => {
  const navigate = useNavigate();
  const { setState } = useAppState();
  const [searchParams] = useSearchParams();

  const [current, setCurrent] = useState(0); // 0 = split question, 1-8 = track questions
  const [audienceType, setAudienceType] = useState<AudienceType | null>(null);
  const [styleAnswers, setStyleAnswers] = useState<Record<string, ChallengeStyle>>({});
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const [showIntro, setShowIntro] = useState(true);
  const trackedStart = useRef(false);

  useEffect(() => {
    if (!trackedStart.current) {
      trackedStart.current = true;
      trackEvent("assessment_started");
    }
  }, []);

  // Capture referral
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && ref.length > 0) {
      try {
        if (ref.startsWith("jv_")) {
          sessionStorage.setItem("challengeos_partner_ref", ref);
        } else {
          sessionStorage.setItem(REF_SESSION_KEY, ref);
        }
      } catch {}
    }
  }, [searchParams]);

  useEffect(() => {
    try {
      const partnerRef = sessionStorage.getItem("challengeos_partner_ref");
      if (partnerRef) {
        (supabase.rpc as any)("track_partner_assessment", { p_partner_code: partnerRef }).then(() => {});
      }
    } catch {}
  }, []);

  const trackQuestions = audienceType === "b2b" ? b2bQuestions : b2cQuestions;
  const progress = ((current + 1) / TOTAL_QUESTIONS) * 100;

  // ── Intro screen ──
  if (showIntro) {
    return (
      <div className="flex flex-col min-h-screen p-6 max-w-lg mx-auto justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Discover your challenge</h1>
          <p className="text-muted-foreground leading-relaxed">
            Answer 9 quick questions. We'll tell you exactly what your evergreen challenge app
            should be about — including the quiz that attracts your leads.
          </p>
          <p className="text-sm text-muted-foreground">Takes about 90 seconds</p>
          <Button
            size="lg"
            className="w-full h-14 text-base rounded-xl gap-2 mt-4"
            onClick={() => setShowIntro(false)}
          >
            Start
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Q1: Split question ──
  if (current === 0) {
    const handleSplit = () => {
      if (!selected) return;
      const type = selected as AudienceType;
      setAudienceType(type);
      trackEvent(type === "b2b" ? "assessment_track_b2b" as any : "assessment_track_b2c" as any);
      setSelected(undefined);
      setCurrent(1);
    };

    return (
      <div className="flex flex-col min-h-screen p-6">
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>Question 1 of {TOTAL_QUESTIONS}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="mb-8 h-2" />
        <h2 className="text-xl font-bold text-foreground mb-6 leading-tight">{splitQuestion.text}</h2>
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="p-0 space-y-3">
            <RadioGroup value={selected} onValueChange={setSelected}>
              {splitQuestion.options.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                    selected === opt.value ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <RadioGroupItem value={opt.value} className="mt-0.5" />
                  <span className="text-sm leading-snug">{opt.label}</span>
                </label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
        <div className="mt-auto pt-8">
          <Button onClick={handleSplit} disabled={!selected} className="w-full h-12 text-base rounded-xl">
            Next
          </Button>
        </div>
      </div>
    );
  }

  // ── Q2-Q9: Track questions ──
  const qIndex = current - 1; // 0-7 index into trackQuestions
  const q = trackQuestions[qIndex];
  if (!q) return null;

  const handleNext = () => {
    if (!selected) return;
    const style = selected as ChallengeStyle;
    const updated = { ...styleAnswers, [q.id]: style };
    setStyleAnswers(updated);
    setSelected(undefined);

    if (current < TOTAL_QUESTIONS - 1) {
      setCurrent(current + 1);
    } else {
      // Score and navigate
      const { scores, recommended, confidence } = scoreAssessment(updated);
      const assessment = {
        audienceType: audienceType!,
        scores,
        recommended,
        confidence,
        completedAt: Date.now(),
      };
      setState((prev) => ({ ...prev, assessment }));
      trackEvent("assessment_completed", { audienceType, recommended, confidence });
      trackEvent(`assessment_result_${recommended}` as any);
      navigate("/results");
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>Question {current + 1} of {TOTAL_QUESTIONS}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="mb-8 h-2" />
      <h2 className="text-xl font-bold text-foreground mb-6 leading-tight">{q.text}</h2>
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="p-0 space-y-3">
          <RadioGroup value={selected} onValueChange={setSelected}>
            {q.options.map((opt) => (
              <label
                key={opt.style}
                className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                  selected === opt.style ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <RadioGroupItem value={opt.style} className="mt-0.5" />
                <span className="text-sm leading-snug">{opt.label}</span>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
      <div className="mt-auto pt-8">
        <Button onClick={handleNext} disabled={!selected} className="w-full h-12 text-base rounded-xl">
          {current < TOTAL_QUESTIONS - 1 ? "Next" : "See my results"}
        </Button>
      </div>
    </div>
  );
};

export default Assessment;
