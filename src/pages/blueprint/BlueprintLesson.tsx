import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UpgradeCard } from "./BlueprintDashboard";

interface LessonContent {
  n: 1 | 2 | 3;
  title: string;
  intro: string;
  takeaways: string[];
  prompt: string;
}

const LESSONS: Record<string, LessonContent> = {
  "1": {
    n: 1,
    title: "Why Challenges Work",
    intro:
      "Most content is passive — people scroll, like, and forget. A challenge flips that. It gives your audience a clear goal, a short timeline, and a reason to act *today*. That's why challenges consistently outperform standalone webinars, lead magnets, and email courses for building real engagement.",
    takeaways: [
      "Challenges create focused action — one clear goal beats ten scattered tips.",
      "People engage more when there's a deadline and a public commitment.",
      "Accountability and community turn casual interest into completion.",
    ],
    prompt: "What would your audience be more likely to act on if they had structure and accountability?",
  },
  "2": {
    n: 2,
    title: "The Challenge Growth Opportunity",
    intro:
      "A well-designed challenge isn't just engagement — it's a growth engine. Participants experience a small win with you before any sales conversation, which builds trust faster than any other format. Done right, a challenge feeds your leads list, your community, and your offers all at once.",
    takeaways: [
      "Challenges generate qualified leads — people self-select by joining.",
      "They build trust through experience, not promises.",
      "They lead naturally into paid offers, services, or community.",
    ],
    prompt: "How could a challenge help your audience experience a small win before they buy from you?",
  },
  "3": {
    n: 3,
    title: "Your Challenge Fit",
    intro:
      "Now it's your turn. Tell us about your audience and the result they want, and we'll generate a personalised challenge growth insight tailored to you.",
    takeaways: [],
    prompt: "",
  },
};

const BlueprintLesson = () => {
  const { day } = useParams();
  const lesson = day ? LESSONS[day] : null;
  if (!lesson) return <Navigate to="/blueprint/dashboard" replace />;

  const { state, setState } = useAppState();
  const navigate = useNavigate();
  const taskKey = `blueprint_lesson_${lesson.n}`;
  const completed = !!state.challenge.tasks[taskKey];

  const markComplete = () => {
    setState((prev) => ({
      ...prev,
      challenge: { ...prev.challenge, tasks: { ...prev.challenge.tasks, [taskKey]: true } },
    }));
    toast.success(`Lesson ${lesson.n} complete`);
  };

  const nextHref = lesson.n < 3 ? `/blueprint/lesson/${lesson.n + 1}` : "/blueprint/insight";

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 lg:py-12">
      <Link to="/blueprint/dashboard" className="inline-flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Dashboard
      </Link>

      <header className="mt-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
          {lesson.n === 1 ? "Foundations" : lesson.n === 2 ? "Growth Opportunity" : "Your Insight"}
        </span>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">{lesson.title}</h1>
      </header>

      <article className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="text-base leading-8 text-foreground">{lesson.intro}</p>
      </article>

      {lesson.n !== 3 ? (
        <>
          <section className="mt-6 rounded-2xl border border-border bg-background p-6">
            <h2 className="text-sm font-black uppercase tracking-wide text-primary">3 Key Takeaways</h2>
            <ul className="mt-4 space-y-3">
              {lesson.takeaways.map((t, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <span className="text-sm leading-6 text-foreground">{t}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <h2 className="text-sm font-black uppercase tracking-wide text-primary">Reflect</h2>
            <p className="mt-3 text-base leading-7 text-foreground">{lesson.prompt}</p>
          </section>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {completed ? (
              <span className="inline-flex items-center gap-2 text-sm font-bold text-success">
                <CheckCircle2 className="h-4 w-4" /> Completed
              </span>
            ) : (
              <Button onClick={markComplete} className="h-11 px-6 text-sm font-black uppercase">Mark Complete</Button>
            )}
            <Button asChild variant="outline" className="h-11 gap-2">
              <Link to={nextHref}>{lesson.n === 1 ? "Next: Growth Opportunity" : "Next: Your Insight"} <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </>
      ) : (
        <Lesson3Form
          onComplete={() => {
            if (!completed) markComplete();
            navigate("/blueprint/insight");
          }}
        />
      )}
    </main>
  );
};

const Lesson3Form = ({ onComplete }: { onComplete: () => void }) => {
  const { state, setState } = useAppState();
  const ai = state.challenge.aiOutputs ?? {};
  const [problem, setProblem] = useState(ai.blueprint_problem || "");
  const [audience, setAudience] = useState(ai.blueprint_audience || "");
  const [result, setResult] = useState(ai.blueprint_result || "");
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string>(ai.blueprint_insight || "");

  const canSubmit = useMemo(() => problem.trim() && audience.trim() && result.trim() && !loading, [problem, audience, result, loading]);

  const generate = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("blueprint-insight", {
        body: { problem: problem.trim(), audience: audience.trim(), result: result.trim() },
      });
      if (error) throw error;
      const text = data?.insight as string;
      if (!text) throw new Error("No insight returned");
      setInsight(text);
      setState((prev) => ({
        ...prev,
        challenge: {
          ...prev.challenge,
          aiOutputs: {
            ...prev.challenge.aiOutputs,
            blueprint_problem: problem.trim(),
            blueprint_audience: audience.trim(),
            blueprint_result: result.trim(),
            blueprint_insight: text,
          },
        },
      }));
      toast.success("Your insight is ready");
    } catch (err: any) {
      toast.error(err?.message || "Could not generate insight. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="mt-6 rounded-2xl border border-border bg-background p-6">
        <h2 className="text-xl font-black">Find Your Challenge Growth Opportunity</h2>
        <p className="mt-1 text-sm text-muted-foreground">Three quick questions. AI does the rest.</p>

        <div className="mt-6 space-y-5">
          <div>
            <Label htmlFor="problem" className="text-sm font-bold">What problem do you solve?</Label>
            <Textarea
              id="problem"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="I help people who struggle with…"
              rows={3}
              maxLength={500}
              className="mt-2 resize-none"
            />
          </div>
          <div>
            <Label htmlFor="audience" className="text-sm font-bold">Who do you solve it for?</Label>
            <Textarea
              id="audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="I help coaches / consultants / business owners / parents / job seekers…"
              rows={2}
              maxLength={300}
              className="mt-2 resize-none"
            />
          </div>
          <div>
            <Label htmlFor="result" className="text-sm font-bold">What result do they want?</Label>
            <Textarea
              id="result"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder="They want to…"
              rows={3}
              maxLength={500}
              className="mt-2 resize-none"
            />
          </div>
        </div>

        <Button onClick={generate} disabled={!canSubmit} className="mt-6 h-12 w-full gap-2 text-sm font-black uppercase">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate My Challenge Insight</>}
        </Button>
      </section>

      {insight && (
        <section className="mt-6 rounded-2xl border border-primary/30 bg-card p-6">
          <h3 className="text-sm font-black uppercase tracking-wide text-primary">Your Insight</h3>
          <div className="prose prose-sm mt-3 max-w-none text-foreground dark:prose-invert">
            <ReactMarkdown>{insight}</ReactMarkdown>
          </div>
          <Button onClick={onComplete} className="mt-6 h-11 w-full gap-2 text-sm font-black uppercase">
            View Full Insight <ArrowRight className="h-4 w-4" />
          </Button>
        </section>
      )}

      <UpgradeCard />
    </>
  );
};

export default BlueprintLesson;
