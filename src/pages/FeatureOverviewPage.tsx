import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, RefreshCw } from "lucide-react";
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
