import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Sparkles, FileCode2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Feature = {
  name: string;
  description: string;
  category: "essential" | "advanced";
  connects: string[];
};

// Eager-load raw source from the four target areas. Vite inlines these at
// build time, so the page works in production too.
const sources = {
  ...import.meta.glob("/src/components/**/*.{ts,tsx}", { query: "?raw", import: "default", eager: true }),
  ...import.meta.glob("/src/hooks/**/*.{ts,tsx}", { query: "?raw", import: "default", eager: true }),
  ...import.meta.glob("/src/lib/**/*.ts", { query: "?raw", import: "default", eager: true }),
  ...import.meta.glob("/src/pages/**/*.tsx", { query: "?raw", import: "default", eager: true }),
  ...import.meta.glob("/supabase/functions/**/index.ts", { query: "?raw", import: "default", eager: true }),
} as Record<string, string>;

function buildManifest(): string {
  const PER_FILE_CAP = 1200; // chars
  const entries = Object.entries(sources)
    .filter(([p]) => !p.includes(".test.") && !p.includes("/ui/")) // skip shadcn primitives + tests
    .sort();

  const parts: string[] = [];
  for (const [path, raw] of entries) {
    const text = String(raw || "");
    // Prefer leading comments + top of file (where intent lives)
    const head = text.slice(0, PER_FILE_CAP);
    parts.push(`### ${path}\n${head}`);
  }
  return parts.join("\n\n");
}

function toMarkdown(features: Feature[], category: "essential" | "advanced"): string {
  const title = category === "essential" ? "Essential Features" : "Advanced Features";
  const stamp = new Date().toISOString();
  const filtered = features.filter((f) => f.category === category);
  const body = filtered
    .map(
      (f) =>
        `## ${f.name}\n\n${f.description}\n\n**Connects to:** ${
          (f.connects || []).join(", ") || "—"
        }`,
    )
    .join("\n\n---\n\n");
  return `# LeadBead ${title}\n\n_Generated ${stamp}_\n\n${body}\n`;
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const FeatureCard = ({ feature }: { feature: Feature }) => (
  <div className="rounded-lg border bg-card p-4 transition-all hover:shadow-md hover:border-primary/40">
    <h3 className="font-bold text-base mb-1">{feature.name}</h3>
    <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
    {feature.connects?.length > 0 && (
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs text-muted-foreground">Connects to:</span>
        {feature.connects.map((c) => (
          <span
            key={c}
            className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground/80 border"
          >
            {c}
          </span>
        ))}
      </div>
    )}
  </div>
);

const FeatureExtractor = () => {
  const [loading, setLoading] = useState(false);
  const [features, setFeatures] = useState<Feature[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileCount = useMemo(() => Object.keys(sources).length, []);

  const run = async () => {
    setLoading(true);
    setError(null);
    setFeatures(null);
    try {
      const manifest = buildManifest();
      const { data, error: fnError } = await supabase.functions.invoke("extract-features", {
        body: { manifest },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      const list: Feature[] = Array.isArray(data?.features) ? data.features : [];
      if (!list.length) throw new Error("No features returned by the model.");
      setFeatures(list);
    } catch (e: any) {
      setError(e?.message || "Extraction failed");
    } finally {
      setLoading(false);
    }
  };

  const essential = (features || []).filter((f) => f.category === "essential");
  const advanced = (features || []).filter((f) => f.category === "advanced");

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Admin · Feature Extractor
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            LeadBead Feature Documentation Generator
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Extract all component-level features from LeadBead, auto-categorized as{" "}
            <strong>Essential</strong> (core user flow: signup → day completion → referral) or{" "}
            <strong>Advanced</strong> (admin / CMS mechanics that enable the core flow).
          </p>
          <p className="text-xs text-muted-foreground mt-3 inline-flex items-center gap-1.5">
            <FileCode2 className="h-3.5 w-3.5" /> {fileCount} source files scanned
          </p>
        </header>

        <Card className="mb-8 border-2">
          <CardContent className="p-8 flex flex-col items-center text-center gap-4">
            <Button
              size="lg"
              onClick={run}
              disabled={loading}
              className="text-base h-12 px-8"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Extract Features & Generate MD Files
                </>
              )}
            </Button>

            {loading && (
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground animate-pulse">
                <p>Analyzing codebase… (components, hooks, Supabase schema, edge functions)</p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3 max-w-md">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="text-left">{error}</span>
              </div>
            )}

            {features && (
              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <Button
                  onClick={() => downloadFile("Essential.md", toMarkdown(features, "essential"))}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Download className="h-4 w-4" /> Download Essential.md
                </Button>
                <Button
                  onClick={() => downloadFile("Advanced.md", toMarkdown(features, "advanced"))}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="h-4 w-4" /> Download Advanced.md
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {features && (
          <div className="grid md:grid-cols-2 gap-6">
            <section>
              <Card className="bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Essential Features</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {essential.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {essential.map((f) => (
                    <FeatureCard key={f.name} feature={f} />
                  ))}
                  {!essential.length && (
                    <p className="text-sm text-muted-foreground">No essential features detected.</p>
                  )}
                </CardContent>
              </Card>
            </section>

            <section>
              <Card className="bg-slate-50/50 dark:bg-slate-950/10 border-slate-200/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Advanced Features</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {advanced.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {advanced.map((f) => (
                    <FeatureCard key={f.name} feature={f} />
                  ))}
                  {!advanced.length && (
                    <p className="text-sm text-muted-foreground">No advanced features detected.</p>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureExtractor;
