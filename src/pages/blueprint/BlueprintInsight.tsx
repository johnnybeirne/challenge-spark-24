import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Loader2, RefreshCcw, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UpgradeCard } from "./BlueprintDashboard";

const BlueprintInsight = () => {
  const { state, setState } = useAppState();
  const navigate = useNavigate();
  const ai = state.challenge.aiOutputs ?? {};
  const problem = ai.blueprint_problem || "";
  const audience = ai.blueprint_audience || "";
  const result = ai.blueprint_result || "";
  const insight = ai.blueprint_insight || "";
  const [loading, setLoading] = useState(false);

  if (!insight) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-12 text-center">
        <h1 className="text-2xl font-black">No insight yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">Complete Lesson 3 to generate your personalised insight.</p>
        <Button asChild className="mt-6"><Link to="/blueprint/lesson/3">Go to Lesson 3</Link></Button>
      </main>
    );
  }

  const copy = async () => {
    await navigator.clipboard.writeText(insight);
    toast.success("Insight copied");
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
      toast.success("Insight regenerated");
    } catch (err: any) {
      toast.error(err?.message || "Could not regenerate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 lg:py-12">
      <Link to="/blueprint/dashboard" className="inline-flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Dashboard
      </Link>

      <header className="mt-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
          <Sparkles className="h-3.5 w-3.5" /> My Insight
        </span>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Your Challenge Growth Insight</h1>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Problem", value: problem },
          { label: "Audience", value: audience },
          { label: "Desired result", value: result },
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
          <Button size="sm" onClick={() => navigate("/blueprint/lesson/3")} variant="ghost">Edit answers</Button>
        </div>
      </section>

      <UpgradeCard />
    </main>
  );
};

export default BlueprintInsight;
