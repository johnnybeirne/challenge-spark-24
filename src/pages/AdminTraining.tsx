import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";
import {
  defaultTrainingContent,
  loadTrainingContent,
  saveTrainingContent,
  type TrainingContent,
  type DashboardTrainingConfig,
  type DayTrainingConfig,
} from "@/lib/trainingContent";
import TrainingVideoCard from "@/components/TrainingVideoCard";
import { trackEvent } from "@/lib/analytics";

type SectionKey = keyof TrainingContent;

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const DashboardEditor = ({
  value,
  onChange,
}: {
  value: DashboardTrainingConfig;
  onChange: (v: DashboardTrainingConfig) => void;
}) => {
  const set = <K extends keyof DashboardTrainingConfig>(k: K, v: DashboardTrainingConfig[K]) =>
    onChange({ ...value, [k]: v });
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
        <div>
          <p className="text-sm font-semibold">Show this training card</p>
          <p className="text-xs text-muted-foreground">Toggle off to hide it from the dashboard.</p>
        </div>
        <Switch checked={value.enabled} onCheckedChange={(v) => set("enabled", v)} />
      </div>
      <Field label="Eyebrow / title"><Input value={value.title} onChange={(e) => set("title", e.target.value)} /></Field>
      <Field label="Video title"><Input value={value.videoTitle} onChange={(e) => set("videoTitle", e.target.value)} /></Field>
      <Field label="Subtitle"><Textarea rows={2} value={value.subtitle} onChange={(e) => set("subtitle", e.target.value)} /></Field>
      <Field label="Video URL (YouTube, Vimeo, or .mp4)"><Input value={value.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://..." /></Field>
      <Field label="Placeholder text (shown when video URL is empty)"><Input value={value.placeholderText} onChange={(e) => set("placeholderText", e.target.value)} /></Field>
      <Field label="Supporting text"><Textarea rows={3} value={value.supportingText} onChange={(e) => set("supportingText", e.target.value)} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Primary CTA text"><Input value={value.primaryCtaText} onChange={(e) => set("primaryCtaText", e.target.value)} /></Field>
        <Field label="Secondary CTA text"><Input value={value.secondaryCtaText} onChange={(e) => set("secondaryCtaText", e.target.value)} /></Field>
      </div>
    </div>
  );
};

const DayEditor = ({
  value,
  onChange,
  dayNum,
}: {
  value: DayTrainingConfig;
  onChange: (v: DayTrainingConfig) => void;
  dayNum: number;
}) => {
  const set = <K extends keyof DayTrainingConfig>(k: K, v: DayTrainingConfig[K]) =>
    onChange({ ...value, [k]: v });
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
        <div>
          <p className="text-sm font-semibold">Show this training card</p>
          <p className="text-xs text-muted-foreground">Toggle off to hide it from /day/{dayNum}.</p>
        </div>
        <Switch checked={value.enabled} onCheckedChange={(v) => set("enabled", v)} />
      </div>
      <Field label="Eyebrow / title"><Input value={value.title} onChange={(e) => set("title", e.target.value)} /></Field>
      <Field label="Video title"><Input value={value.videoTitle} onChange={(e) => set("videoTitle", e.target.value)} /></Field>
      <Field label="Subtitle"><Textarea rows={2} value={value.subtitle} onChange={(e) => set("subtitle", e.target.value)} /></Field>
      <Field label="Video URL (YouTube, Vimeo, or .mp4)"><Input value={value.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://..." /></Field>
      <Field label="Placeholder text"><Input value={value.placeholderText} onChange={(e) => set("placeholderText", e.target.value)} /></Field>
      <Field label="Key lesson"><Textarea rows={3} value={value.keyLesson} onChange={(e) => set("keyLesson", e.target.value)} /></Field>
      <Field label="CTA text"><Input value={value.ctaText} onChange={(e) => set("ctaText", e.target.value)} /></Field>
    </div>
  );
};

const PreviewPane = ({ section, content }: { section: SectionKey; content: TrainingContent }) => {
  if (section === "dashboard") {
    const cfg = content.dashboard;
    if (!cfg.enabled) return <p className="text-sm text-muted-foreground">Disabled — hidden from users.</p>;
    return (
      <TrainingVideoCard
        eyebrow={cfg.title}
        videoTitle={cfg.videoTitle}
        subtitle={cfg.subtitle}
        placeholderLabel={cfg.placeholderText}
        lesson={cfg.supportingText}
        videoUrl={cfg.videoUrl}
        watched={false}
        ctaLabel="Mark as watched"
        onMarkWatched={() => {}}
        primaryCta={{ label: cfg.primaryCtaText, onClick: () => {} }}
        secondaryCta={{ label: cfg.secondaryCtaText, onClick: () => {} }}
      />
    );
  }
  const cfg = content[section];
  if (!cfg.enabled) return <p className="text-sm text-muted-foreground">Disabled — hidden from users.</p>;
  return (
    <TrainingVideoCard
      eyebrow={cfg.title}
      videoTitle={cfg.videoTitle}
      subtitle={cfg.subtitle}
      placeholderLabel={cfg.placeholderText}
      lesson={cfg.keyLesson}
      videoUrl={cfg.videoUrl}
      watched={false}
      ctaLabel={cfg.ctaText}
      onMarkWatched={() => {}}
    />
  );
};

const AdminTraining = () => {
  const [content, setContent] = useState<TrainingContent>(() => loadTrainingContent());
  const [active, setActive] = useState<SectionKey>("dashboard");

  useEffect(() => { trackEvent("admin_training_viewed"); }, []);

  const update = <K extends SectionKey>(key: K, v: TrainingContent[K]) =>
    setContent((prev) => ({ ...prev, [key]: v }));

  const handleSave = (key: SectionKey) => {
    const original = loadTrainingContent();
    const cfg = content[key];
    if (!cfg.title?.trim() || !cfg.videoTitle?.trim()) {
      toast.error("Title and video title are required.");
      return;
    }
    saveTrainingContent(content);
    if (cfg.videoUrl && !original[key].videoUrl) trackEvent("training_video_url_added", { section: key });
    if (!cfg.enabled && original[key].enabled) trackEvent("training_section_disabled", { section: key });
    if (cfg.enabled && !original[key].enabled) trackEvent("training_section_enabled", { section: key });
    trackEvent("admin_training_updated", { section: key });
    toast.success("Training content updated");
  };

  const resetSection = (key: SectionKey) => {
    update(key, defaultTrainingContent[key] as any);
    toast.message("Reverted to default — click Save to apply.");
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Training System</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit the dashboard intro and Day 1–3 training cards. Changes apply immediately.
        </p>
      </header>

      <Tabs value={active} onValueChange={(v) => setActive(v as SectionKey)}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="day1">Day 1</TabsTrigger>
          <TabsTrigger value="day2">Day 2</TabsTrigger>
          <TabsTrigger value="day3">Day 3</TabsTrigger>
        </TabsList>

        {(["dashboard", "day1", "day2", "day3"] as SectionKey[]).map((key) => (
          <TabsContent key={key} value={key} className="mt-4">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <Card>
                <CardContent className="p-5 sm:p-6">
                  {key === "dashboard" ? (
                    <DashboardEditor value={content.dashboard} onChange={(v) => update("dashboard", v)} />
                  ) : (
                    <DayEditor
                      value={content[key] as DayTrainingConfig}
                      onChange={(v) => update(key, v)}
                      dayNum={Number(key.replace("day", ""))}
                    />
                  )}
                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <Button onClick={() => handleSave(key)} className="gap-2">
                      <Save className="h-4 w-4" /> Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => resetSection(key)}>
                      Reset to default
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live preview</p>
                <PreviewPane section={key} content={content} />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminTraining;
