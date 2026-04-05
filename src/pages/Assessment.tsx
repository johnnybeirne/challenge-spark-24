import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Dimension = "trust" | "activation" | "ownership" | "clarity";

interface Question {
  id: string;
  text: string;
  dimension: Dimension;
  options: { value: number; label: string }[];
}

const questions: Question[] = [
  {
    id: "q1",
    text: "How often does your audience act on your recommendations?",
    dimension: "trust",
    options: [
      { value: 1, label: "Rarely — they consume but don't act" },
      { value: 2, label: "Sometimes — a few respond" },
      { value: 3, label: "Often — I get DMs and replies" },
      { value: 4, label: "Almost always — they buy, share, and refer" },
    ],
  },
  {
    id: "q2",
    text: "How comfortable are you asking your audience for something?",
    dimension: "trust",
    options: [
      { value: 1, label: "Very uncomfortable — I avoid it" },
      { value: 2, label: "Awkward — I do it rarely" },
      { value: 3, label: "Comfortable — I ask when it matters" },
      { value: 4, label: "Natural — asking is part of our relationship" },
    ],
  },
  {
    id: "q3",
    text: "How often do you turn followers into email subscribers or customers?",
    dimension: "activation",
    options: [
      { value: 1, label: "Never — I don't have a system" },
      { value: 2, label: "Occasionally — when I remember" },
      { value: 3, label: "Regularly — I have a basic funnel" },
      { value: 4, label: "Consistently — it's automated" },
    ],
  },
  {
    id: "q4",
    text: "When you share something, how quickly does your audience engage?",
    dimension: "activation",
    options: [
      { value: 1, label: "Crickets — little to no response" },
      { value: 2, label: "Slow — a trickle over days" },
      { value: 3, label: "Same day — decent engagement" },
      { value: 4, label: "Within minutes — instant response" },
    ],
  },
  {
    id: "q5",
    text: "Do you own your audience relationship (email list, community) or rent it (social only)?",
    dimension: "ownership",
    options: [
      { value: 1, label: "Fully rented — social platforms only" },
      { value: 2, label: "Mostly rented — small email list" },
      { value: 3, label: "Mixed — growing owned channels" },
      { value: 4, label: "Mostly owned — strong list & community" },
    ],
  },
  {
    id: "q6",
    text: "If a platform disappeared tomorrow, could you still reach your audience?",
    dimension: "ownership",
    options: [
      { value: 1, label: "No — I'd lose everything" },
      { value: 2, label: "Maybe — I'd lose most of them" },
      { value: 3, label: "Partially — I'd keep about half" },
      { value: 4, label: "Yes — I have direct access" },
    ],
  },
  {
    id: "q7",
    text: "How clearly can you describe the transformation you offer your audience?",
    dimension: "clarity",
    options: [
      { value: 1, label: "I'm not sure what I offer" },
      { value: 2, label: "I have a vague idea" },
      { value: 3, label: "I can explain it in a few sentences" },
      { value: 4, label: "One sentence — crystal clear" },
    ],
  },
  {
    id: "q8",
    text: "Does your audience know what to do next after consuming your content?",
    dimension: "clarity",
    options: [
      { value: 1, label: "No — there's no clear next step" },
      { value: 2, label: "Sometimes — it depends on the content" },
      { value: 3, label: "Usually — I include CTAs" },
      { value: 4, label: "Always — every piece has a clear path" },
    ],
  },
];

function getIdentityType(scores: Record<Dimension, number>): string {
  const sorted = (Object.entries(scores) as [Dimension, number][]).sort(
    (a, b) => b[1] - a[1]
  );
  const top = sorted[0][0];
  const bottom = sorted[sorted.length - 1][0];

  if (top === "trust" && bottom === "activation") return "hidden_authority";
  if (top === "activation" && bottom === "ownership") return "momentum_builder";
  if (top === "ownership" || top === "clarity") return "network_catalyst";
  return "unactivated_audience";
}

const REF_SESSION_KEY = "challengeos_ref";

const Assessment = () => {
  const navigate = useNavigate();
  const { setState } = useAppState();
  const [searchParams] = useSearchParams();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string | undefined>(undefined);

  // Capture referral code from URL
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && ref.length > 0) {
      try {
        sessionStorage.setItem(REF_SESSION_KEY, ref);
      } catch {}
    }
  }, [searchParams]);

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  const handleNext = () => {
    if (!selected) return;
    const updated = { ...answers, [q.id]: Number(selected) };
    setAnswers(updated);
    setSelected(undefined);

    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      const dims: Record<Dimension, number> = { trust: 0, activation: 0, ownership: 0, clarity: 0 };
      questions.forEach((question) => {
        dims[question.dimension] += updated[question.id] || 0;
      });
      const total = Object.values(dims).reduce((a, b) => a + b, 0);
      const percentage = Math.round((total / 32) * 100);
      const identityType = getIdentityType(dims);

      const assessment = { scores: dims, total, percentage, identityType, completedAt: Date.now() };
      setState((prev) => ({ ...prev, assessment }));
      navigate("/results");
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>Question {current + 1} of {questions.length}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="mb-8 h-2" />

      <h2 className="text-xl font-bold text-foreground mb-6 leading-tight">{q.text}</h2>

      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="p-0 space-y-3">
          <RadioGroup value={selected} onValueChange={setSelected}>
            {q.options.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                  selected === String(opt.value)
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <RadioGroupItem value={String(opt.value)} className="mt-0.5" />
                <span className="text-sm leading-snug">{opt.label}</span>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="mt-auto pt-8">
        <Button
          onClick={handleNext}
          disabled={!selected}
          className="w-full h-12 text-base rounded-xl"
        >
          {current < questions.length - 1 ? "Next" : "See my results"}
        </Button>
      </div>
    </div>
  );
};

export default Assessment;
