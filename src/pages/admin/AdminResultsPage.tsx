import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PreviewButton from "@/components/admin/PreviewButton";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, LayoutList, ChevronRight } from "lucide-react";
import { invalidatePage } from "@/hooks/useSiteContent";

const SIZES = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const FIELDS = [
  { key: "heading", label: "Heading" },
  { key: "heading_size", label: "Heading size" },
  { key: "subheading", label: "Subheading" },
  { key: "subheading_size", label: "Subheading size" },
];

// Nine advice texts for the three-column breakdown: one per category per band.
const BREAKDOWN_FIELDS = (["system", "audience", "conversion"] as const).flatMap((cat) =>
  (["low", "mid", "high"] as const).map((band) => ({
    key: `${cat}_${band}`,
    label: `${cat[0].toUpperCase()}${cat.slice(1)}, ${band} scores`,
  })),
);


type LinkCard = { kind: "link"; title: string; description: string; url: string };
type InlineCard = { kind: "inline"; id: string; title: string; description: string };
type BlockCard = LinkCard | InlineCard;

// Same top to bottom order as the live results page.
const BLOCKS: BlockCard[] = [
  {
    kind: "inline",
    id: "score_header",
    title: "1. Score header",
    description: "The heading and line of text above the score dial.",
  },
  {
    kind: "link",
    title: "2. The score dial",
    description: "The numbers come from the quiz. Edit the score bands and category wording here.",
    url: "/owner-console/diagnostic-responses",
  },
  {
    kind: "link",
    title: "3. Based on your answers, You're an ...",
    description: "The intro line, archetype names and taglines.",
    url: "/owner-console/diagnostic-responses",
  },
  {
    kind: "inline",
    id: "advisor_card",
    title: "4. Advisor card",
    description: "The name shown above the written message. The message itself is on Lead Gen Quiz Responses.",
  },
  {
    kind: "inline",
    id: "breakdown",
    title: "5. System, Audience, Conversion breakdown",
    description: "The three-column score breakdown. One advice text per category per score band.",
  },
  {
    kind: "inline",
    id: "cta",
    title: "6. Join button and urgency line",
    description: "The button wording and the line of text under it for each score band.",
  },
  {
    kind: "link",
    title: "7. Report opt-in card",
    description: "The get your report by email card and its code bar.",
    url: "/owner-console/results-optin-card",
  },
  {
    kind: "inline",
    id: "advisor_section",
    title: "8. See what the 3-Day Challenge can do for you",
    description: "The heading of the final advisor section. Its suggested questions have their own screen.",
  },
  {
    kind: "link",
    title: "Suggested questions",
    description: "The questions offered inside the final advisor section.",
    url: "/owner-console/results-advisor-prompts",
  },
  {
    kind: "link",
    title: "9. Results Page Editor - Non-signup",
    description: "The teaser, join button and not-available messages on the report page sent to leads.",
    url: "/owner-console/report-page",
  },
  {
    kind: "link",
    title: "Section blocks (Quiz LP Editor)",
    description: "Eyebrow, section title and body blocks for the Results page.",
    url: "/owner-console/content",
  },
];

const AdminResultsPage = () => {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [globals, setGlobals] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("section,key,value")
      .eq("page", "results")
      .in("section", ["score_header", "advisor_card", "breakdown", "cta", "advisor_section"])
      .then(({ data, error }) => {
        if (error) {
          toast.error("Could not load the results page copy");
          return;
        }
        const v: Record<string, string> = {};
        for (const r of data ?? []) v[`${r.section}.${r.key}`] = r.value;
        setValues(v);
      });

    supabase
      .from("site_content")
      .select("key,value")
      .eq("page", "global")
      .eq("section", "urgency")
      .then(({ data, error }) => {
        if (error) {
          toast.error("Could not load the urgency lines");
          return;
        }
        const v: Record<string, string> = {};
        for (const r of data ?? []) v[r.key] = r.value;
        setGlobals(v);
      });
  }, []);

  const set = (key: string, value: string) => setValues((prev) => ({ ...(prev ?? {}), [key]: value }));
  const setGlobal = (key: string, value: string) => setGlobals((prev) => ({ ...(prev ?? {}), [key]: value }));

  const saveRows = async (
    id: string,
    rows: { page: string; section: string; key: string; value: string; value_type: string; label?: string; sort_order?: number }[],
    pagesToInvalidate: string[],
  ) => {
    const clean = rows.filter((r) => (r.value ?? "").trim() !== "");
    if (clean.length === 0) {
      toast.error("Nothing to save yet");
      return;
    }
    setSaving(id);
    const { error } = await supabase.from("site_content").upsert(clean, { onConflict: "page,section,key" });
    setSaving(null);
    if (error) {
      toast.error("Could not save");
      return;
    }
    for (const p of pagesToInvalidate) invalidatePage(p);
    toast.success("Saved");
  };

  const saveScoreHeader = () =>
    saveRows(
      "score_header",
      FIELDS.map((f, i) => ({
        page: "results",
        section: "score_header",
        key: f.key,
        value: values?.[`score_header.${f.key}`] ?? "",
        value_type: "text",
        label: f.label,
        sort_order: i,
      })),
      ["results"],
    );

  const saveAdvisorCard = () =>
    saveRows(
      "advisor_card",
      [
        {
          page: "results",
          section: "advisor_card",
          key: "name",
          value: values?.["advisor_card.name"] ?? "",
          value_type: "text",
          label: "Advisor name",
          sort_order: 0,
        },
      ],
      ["results"],
    );

  const saveBreakdown = () =>
    saveRows(
      "breakdown",
      [
        {
          page: "results",
          section: "breakdown",
          key: "empty_state",
          value: values?.["breakdown.empty_state"] ?? "",
          value_type: "text",
          label: "Message when a score is missing",
          sort_order: 0,
        },
        ...BREAKDOWN_FIELDS.map((f, i) => ({
          page: "results",
          section: "breakdown",
          key: f.key,
          value: values?.[`breakdown.${f.key}`] ?? "",
          value_type: "text",
          label: f.label,
          sort_order: i + 1,
        })),
      ],
      ["results"],
    );

  const saveAdvisorSection = () =>
    saveRows(
      "advisor_section",
      [
        {
          page: "results",
          section: "advisor_section",
          key: "heading",
          value: values?.["advisor_section.heading"] ?? "",
          value_type: "text",
          label: "Section heading",
          sort_order: 0,
        },
      ],
      ["results"],
    );

  const saveCta = async () => {
    const rows = [
      {
        page: "results",
        section: "cta",
        key: "primary",
        value: values?.["cta.primary"] ?? "",
        value_type: "text",
        label: "Button wording",
        sort_order: 0,
      },
      ...(["low", "mid", "high"] as const).map((tier, i) => ({
        page: "global",
        section: "urgency",
        key: `results_${tier}`,
        value: globals?.[`results_${tier}`] ?? "",
        value_type: "text",
        label: `Urgency line (${tier})`,
        sort_order: i,
      })),
    ];
    await saveRows("cta", rows, ["results", "global"]);
  };

  const loading = !values || !globals;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutList className="h-6 w-6 text-primary" />
            Results Page Editor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every block on the results page, in the order it appears.
          </p>
        </div>
        <PreviewButton href="/results/high" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parts of this page</CardTitle>
          <CardDescription>Each one opens the screen that owns that copy.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {BLOCKS.map((b) =>
            b.kind === "link" ? (
              <Link
                key={b.title}
                to={b.url}
                className="flex items-start justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
              >
                <div>
                  <div className="font-medium">{b.title}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{b.description}</div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground mt-1" />
              </Link>
            ) : (
              <a
                key={b.id}
                href={`#${b.id}`}
                className="flex items-start justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
              >
                <div>
                  <div className="font-medium">{b.title}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{b.description}</div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground mt-1" />
              </a>
            ),
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <>
          <Card id="score_header">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Score header</CardTitle>
                  <CardDescription>The heading and line of text above the score dial.</CardDescription>
                </div>
                <Button onClick={saveScoreHeader} disabled={saving === "score_header"}>
                  {saving === "score_header" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label>Heading</Label>
                <Input
                  value={values["score_header.heading"] ?? ""}
                  placeholder="Your Lead Generation Score"
                  onChange={(e) => set("score_header.heading", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Heading size</Label>
                <Select
                  value={values["score_header.heading_size"] ?? "small"}
                  onValueChange={(v) => set("score_header.heading_size", v)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subheading</Label>
                <Textarea
                  rows={2}
                  value={values["score_header.subheading"] ?? ""}
                  placeholder="Get a clear set of findings, then a recommended strategy."
                  onChange={(e) => set("score_header.subheading", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Subheading size</Label>
                <Select
                  value={values["score_header.subheading_size"] ?? "medium"}
                  onValueChange={(v) => set("score_header.subheading_size", v)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card id="advisor_card">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Advisor card</CardTitle>
                  <CardDescription>
                    The name shown above the written message. The message itself lives on Lead Gen Quiz Responses.
                  </CardDescription>
                </div>
                <Button onClick={saveAdvisorCard} disabled={saving === "advisor_card"}>
                  {saving === "advisor_card" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={values["advisor_card.name"] ?? ""}
                  placeholder="Johnny B"
                  onChange={(e) => set("advisor_card.name", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card id="breakdown">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">System, Audience, Conversion breakdown</CardTitle>
                  <CardDescription>
                    One advice text per category per score band. Each person's own percentages decide which text shows.
                  </CardDescription>
                </div>
                <Button onClick={saveBreakdown} disabled={saving === "breakdown"}>
                  {saving === "breakdown" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label>Message when a score is missing</Label>
                <Input
                  value={values["breakdown.empty_state"] ?? ""}
                  onChange={(e) => set("breakdown.empty_state", e.target.value)}
                  placeholder="Not enough answers yet to score this area."
                />
                <p className="text-xs text-muted-foreground">
                  Shown in place of the percentage when a category has no answers behind it. The low-band advice still appears underneath.
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
              {BREAKDOWN_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label>{f.label}</Label>
                  <Textarea
                    rows={3}
                    value={values[`breakdown.${f.key}`] ?? ""}
                    onChange={(e) => set(`breakdown.${f.key}`, e.target.value)}
                  />
                </div>
              ))}
              </div>
            </CardContent>
          </Card>

          <Card id="cta">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Join button and urgency line</CardTitle>
                  <CardDescription>
                    Use {"{day}"} in an urgency line to drop in the finishing day name.
                  </CardDescription>
                </div>
                <Button onClick={saveCta} disabled={saving === "cta"}>
                  {saving === "cta" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label>Button wording</Label>
                <Input
                  value={values["cta.primary"] ?? ""}
                  placeholder="Join the 3-Day Challenge"
                  onChange={(e) => set("cta.primary", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Urgency line, lower scores</Label>
                <Textarea
                  rows={2}
                  value={globals["results_low"] ?? ""}
                  placeholder="Your first real win is 3 days away. Start now and have this in place by {day}."
                  onChange={(e) => setGlobal("results_low", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Urgency line, middle scores</Label>
                <Textarea
                  rows={2}
                  value={globals["results_mid"] ?? ""}
                  placeholder="Start now and have this in place by {day}."
                  onChange={(e) => setGlobal("results_mid", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Urgency line, higher scores</Label>
                <Textarea
                  rows={2}
                  value={globals["results_high"] ?? ""}
                  placeholder="The next group starts in days, not weeks. Start now and have this in place by {day}."
                  onChange={(e) => setGlobal("results_high", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card id="advisor_section">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Final advisor section</CardTitle>
                  <CardDescription>The heading above the suggested questions at the foot of the page.</CardDescription>
                </div>
                <Button onClick={saveAdvisorSection} disabled={saving === "advisor_section"}>
                  {saving === "advisor_section" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label>Heading</Label>
                <Input
                  value={values["advisor_section.heading"] ?? ""}
                  placeholder="See what the 3-Day Challenge can do for you"
                  onChange={(e) => set("advisor_section.heading", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

        </>
      )}
    </div>
  );
};

export default AdminResultsPage;
