import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Loader2, RefreshCcw, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import DictatedTextarea from "@/components/dictation/DictatedTextarea";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TrainingHomeLink from "@/components/TrainingHomeLink";

const InsightForm = ({ onDone }: { onDone?: () => void }) => {
  const { state, setState } = useAppState();
  const ai = state.challenge.aiOutputs ?? {};
  const [problem, setProblem] = useState(ai.blueprint_problem || "");
  const [audience, setAudience] = useState(ai.blueprint_audience || "");
  const [result, setResult] = useState(ai.blueprint_result || "");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(
    () => problem.trim() && audience.trim() && result.trim() && !loading,
    [problem, audience, result, loading]
  );

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
      toast.success("Your challenge framework is ready");
      onDone?.();
    } catch (err: any) {
      toast.error(err?.message || "Could not generate challenge. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-background p-6">
      <h2 className="text-xl font-black">Build Your Challenge</h2>
      <p className="mt-1 text-sm text-muted-foreground">Answer 3 quick questions to create your challenge structure.</p>

      <div className="mt-6 space-y-5">
        <div>
          <Label htmlFor="problem" className="text-sm font-bold">What problem does your audience want to solve?</Label>
          <DictatedTextarea id="problem" value={problem} onChange={(e) => setProblem(e.target.value)}
            placeholder="People struggle with…" rows={3} maxLength={500} className="mt-2 resize-none" />
        </div>
        <div>
          <Label htmlFor="audience" className="text-sm font-bold">Who is this challenge for?</Label>
          <DictatedTextarea id="audience" value={audience} onChange={(e) => setAudience(e.target.value)}
            placeholder="Coaches, consultants, creators, business owners…" rows={2} maxLength={300} className="mt-2 resize-none" />
        </div>
        <div>
          <Label htmlFor="result" className="text-sm font-bold">What transformation or outcome do they want?</Label>
          <DictatedTextarea id="result" value={result} onChange={(e) => setResult(e.target.value)}
            placeholder="Generate leads, lose weight, improve confidence, get clients…" rows={3} maxLength={500} className="mt-2 resize-none" />
        </div>
      </div>

      <Button onClick={generate} disabled={!canSubmit} className="mt-6 h-12 w-full gap-2 text-sm font-black uppercase">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate My Challenge</>}
      </Button>
    </section>
  );
};

const BlueprintInsight = () => {
  const { state, setState } = useAppState();
  const navigate = useNavigate();
  const ai = state.challenge.aiOutputs ?? {};
  const problem = ai.blueprint_problem || "";
  const audience = ai.blueprint_audience || "";
  const result = ai.blueprint_result || "";
  const insight = ai.blueprint_insight || "";
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  if (!insight || editing) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 lg:py-12">
        <Link to="/blueprint/dashboard" className="inline-flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Course Home
        </Link>
        <header className="mt-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Challenge Builder
          </span>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Build Your Challenge</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Describe the problem you solve, who you help, and the result they want — and we'll help you create a simple challenge framework designed to drive engagement and momentum.
          </p>
        </header>
        <InsightForm onDone={() => setEditing(false)} />
      </main>
    );
  }

  const copy = async () => {
    await navigator.clipboard.writeText(insight);
    toast.success("Challenge copied");
  };

  const regenerate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("blueprint-insight", {
        body: { problem, audience, result },
      });
      if (error) throw error;
      const text = data?.insight as string;
      if (!text) throw new Error("No insight returned");
      setState((prev) => ({
        ...prev,
        challenge: {
          ...prev.challenge,
          aiOutputs: { ...prev.challenge.aiOutputs, blueprint_insight: text },
        },
      }));
      toast.success("Challenge regenerated");
    } catch (err: any) {
      toast.error(err?.message || "Could not regenerate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 lg:py-12">
      <Link to="/blueprint/dashboard" className="inline-flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Course Home
      </Link>

      <header className="mt-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Challenge Builder
        </span>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Your Challenge Framework</h1>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Problem", value: problem },
          { label: "Audience", value: audience },
          { label: "Desired outcome", value: result },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1.5 text-sm leading-6 text-foreground">{value || "—"}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-primary/30 bg-card p-6 sm:p-8">
        <div className="prose prose-sm max-w-none text-foreground dark:prose-invert sm:prose-base">
          <ReactMarkdown>{insight}</ReactMarkdown>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={copy} variant="outline" size="sm" className="gap-2"><Copy className="h-3.5 w-3.5" /> Copy</Button>
          <Button onClick={regenerate} variant="outline" size="sm" className="gap-2" disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />} Regenerate
          </Button>
          <Button size="sm" onClick={() => setEditing(true)} variant="ghost">Edit answers</Button>
        </div>
      </section>

    </main>
  );
};


export default BlueprintInsight;

