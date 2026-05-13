import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Copy, RefreshCw } from "lucide-react";
import { SEO } from "@/components/SEO";
import { toast } from "sonner";
import { overviewToText, scanBuiltFeatures, type FeatureOverview } from "@/lib/featureOverview";

type FeatureOverviewPageProps = {
  mode: "admin" | "user";
};

const formatTime = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);

const WorkflowChart = ({ title, steps }: { title: string; steps: string[] }) => (
  <section className="mb-6 rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Badge variant="outline" className="mb-2">Workflow</Badge>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      </div>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        A visual path through what is already built in the app.
      </p>
    </div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {steps.map((step, index) => (
        <div key={step} className="relative flex min-h-28 gap-3 rounded-md border border-border bg-background p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {index + 1}
          </span>
          <div className="flex min-w-0 flex-1 items-center">
            <p className="text-sm font-medium leading-6 text-foreground">{step}</p>
          </div>
          {index < steps.length - 1 && (
            <span className="absolute -bottom-3 left-1/2 z-10 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-card md:-right-3 md:bottom-auto md:left-auto md:top-1/2 md:-translate-y-1/2 md:translate-x-0">
              <ArrowRight className="h-3.5 w-3.5 rotate-90 text-muted-foreground md:rotate-0" />
            </span>
          )}
        </div>
      ))}
    </div>
  </section>
);

const FeatureOverviewPage = ({ mode }: FeatureOverviewPageProps) => {
  const [scan, setScan] = useState(() => scanBuiltFeatures());
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("Features up to date");

  const overview: FeatureOverview = mode === "admin" ? scan.admin : scan.user;
  const totalFeatures = useMemo(
    () => overview.groups.reduce((sum, group) => sum + group.items.length, 0),
    [overview.groups],
  );

  const refreshFeatures = useCallback(() => {
    setUpdating(true);
    setStatus("Updating features…");
    window.setTimeout(() => {
      setScan(scanBuiltFeatures());
      setUpdating(false);
      setStatus("Features up to date");
    }, 350);
  }, []);

  const copyOverview = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(overviewToText(overview));
      setCopied(true);
      toast.success("Feature overview copied");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copy failed");
    }
  }, [overview]);

  return (
    <>
      <SEO title="Platform Features" description="Explore the full Leadio platform — from assessment funnels and AI challenges to referral loops and partner networks." canonical="/app/features" />
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <Badge variant="secondary" className="mb-3">Client-ready overview</Badge>
              <h1 className="text-3xl font-bold tracking-normal text-foreground">{overview.title}</h1>
              <div className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground sm:text-base">
                {overview.summary.map((line) => <p key={line}>{line}</p>)}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
              <Button onClick={refreshFeatures} disabled={updating} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${updating ? "animate-spin" : ""}`} />
                Refresh Features
              </Button>
              <Button variant="outline" onClick={copyOverview} className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy overview"}
              </Button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>Last updated: {formatTime(scan.generatedAt)}</span>
            <span>{totalFeatures} features documented</span>
            <span>{status}</span>
          </div>
        </section>

        {overview.workflow?.length && (
          <WorkflowChart title={mode === "admin" ? "Administrator Workflow" : "User Workflow"} steps={overview.workflow} />
        )}

        <section className="space-y-5">
          {overview.groups.map((group) => (
            <Card key={group.title}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{group.title}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {group.items.map((item) => (
                  <div key={item.title} className="rounded-md border border-border bg-background p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                      {item.partial && <Badge variant="outline">Partial</Badge>}
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground"><span className="font-medium text-foreground">What it does:</span> {item.does}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground"><span className="font-medium text-foreground">Why it matters:</span> {item.matters}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>

        {overview.journey && (
          <section className="mt-6 rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-foreground">User Journey</h2>
            <ol className="grid gap-3 md:grid-cols-2">
              {overview.journey.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-md bg-background p-3 text-sm text-muted-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-5">
          <h2 className="mb-2 text-lg font-semibold text-foreground">{mode === "admin" ? "Admin" : "User"} Summary Snapshot</h2>
          <p className="text-sm leading-6 text-muted-foreground">{overview.snapshot}</p>
        </section>
      </div>
    </div>
  );
};

export default FeatureOverviewPage;
