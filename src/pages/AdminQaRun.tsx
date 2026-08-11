import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Info, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";

type Status = "pass" | "fail" | "info";

interface Step {
  id: string;
  label: string;
  status: Status;
  ms: number;
  message: string;
}

interface RunResult {
  ok: boolean;
  passed: number;
  total: number;
  kept?: boolean;
  demo_email?: string;
  steps: Step[];
}

const statusStyles: Record<Status, string> = {
  pass: "text-emerald-600 dark:text-emerald-400",
  fail: "text-red-600 dark:text-red-400",
  info: "text-muted-foreground",
};

const StatusIcon = ({ status }: { status: Status }) => {
  if (status === "pass") return <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
  if (status === "fail") return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
  return <Info className="h-5 w-5 text-muted-foreground" />;
};

export default function AdminQaRun() {
  const [running, setRunning] = useState(false);
  const [keepData, setKeepData] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("qa-run", {
        body: { keep_data: keepData },
      });
      if (error) throw error;
      setResult(data as RunResult);
      const r = data as RunResult;
      if (r.passed === r.total) toast.success(`All ${r.total} checks passed`);
      else toast.warning(`${r.passed} of ${r.total} checks passed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Run failed");
    } finally {
      setRunning(false);
    }
  };

  const allPassed = result && result.passed === result.total;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <SEO title="QA challenge runner" description="Owner-only end to end challenge test runner." noIndex />

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">QA challenge runner</h1>
        <p className="text-sm text-muted-foreground">
          Runs the full challenge sequence against a throwaway demo participant with a fast forwarded clock, then
          deletes everything it created. Real participant data is never written to.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="flex items-center gap-3">
            <Switch id="keep-data" checked={keepData} onCheckedChange={setKeepData} disabled={running} />
            <Label htmlFor="keep-data" className="cursor-pointer text-sm">
              Keep demo data for debugging
            </Label>
          </div>
          <Button onClick={run} disabled={running}>
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            {running ? "Running" : result ? "Run again" : "Run"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              {result.passed} of {result.total} checks passed
            </CardTitle>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                allPassed
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
              }`}
            >
              {allPassed ? "Pass" : "Attention needed"}
            </span>
          </CardHeader>
          <CardContent className="space-y-0 divide-y">
            {result.steps.map((step) => (
              <div key={step.id} className="flex items-start gap-3 py-3">
                <StatusIcon status={step.status} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium">{step.label}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{step.ms}ms</span>
                  </div>
                  <p className={`mt-0.5 break-words text-sm ${statusStyles[step.status]}`}>{step.message}</p>
                </div>
              </div>
            ))}
            {result.kept && result.demo_email && (
              <p className="pt-3 text-xs text-muted-foreground">Demo participant kept: {result.demo_email}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
