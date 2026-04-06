import { useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { useSiteConfig, type LandingConfig, type FeatureCard, type HowItWorksStep, type ExampleCard, type FaqItem, type SocialProofItem } from "@/context/SiteConfigContext";
import { Plus, Trash2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const CmsLanding = () => {
  const { config, updateSection } = useSiteConfig();
  const [draft, setDraft] = useState<LandingConfig>({ ...config.landing });

  const update = <K extends keyof LandingConfig>(key: K, value: LandingConfig[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const save = () => {
    updateSection("landing", draft);
    toast.success("Landing page updated");
  };

  const countdownDate = draft.countdownTarget ? new Date(draft.countdownTarget) : undefined;

  const SectionHeader = ({ title, desc }: { title: string; desc?: string }) => (
    <div className="pt-4">
      <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">{title}</h3>
      {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Landing Page</h2>
        <p className="text-sm text-muted-foreground">Edit the public landing page content.</p>
      </div>

      {/* ── Hero ── */}
      <section className="space-y-4">
        <SectionHeader title="Hero Section" />
        <Field label="Headline" value={draft.heroHeadline} onChange={(v) => update("heroHeadline", v)} />
        <Field label="Subheadline" value={draft.heroSubheadline} onChange={(v) => update("heroSubheadline", v)} multi />
        <Field label="Supporting line" value={draft.heroSupportingLine} onChange={(v) => update("heroSupportingLine", v)} />
        <Field label="Micro proof" value={draft.heroMicroProof} onChange={(v) => update("heroMicroProof", v)} />
        <Field label="CTA text" value={draft.primaryCtaText} onChange={(v) => update("primaryCtaText", v)} />
        <Field label="CTA link" value={draft.primaryCtaLink} onChange={(v) => update("primaryCtaLink", v)} />
        <Field label="Below CTA text" value={draft.heroBelowCtaText} onChange={(v) => update("heroBelowCtaText", v)} />
      </section>

      {/* ── Features ── */}
      <section className="space-y-4">
        <SectionHeader title="Features Section" />
        <ToggleField label="Show features section" checked={draft.showFeatures} onChange={(v) => update("showFeatures", v)} />
        <Field label="Section title" value={draft.featuresTitle} onChange={(v) => update("featuresTitle", v)} />
        <Label className="text-xs">Feature cards</Label>
        {draft.featureCards.map((card, i) => (
          <div key={i} className="flex gap-2 items-start">
            <Input className="w-12" value={card.icon} onChange={(e) => updateArrayItem(draft.featureCards, i, { ...card, icon: e.target.value }, (v) => update("featureCards", v))} />
            <div className="flex-1 space-y-1">
              <Input placeholder="Title" value={card.title} onChange={(e) => updateArrayItem(draft.featureCards, i, { ...card, title: e.target.value }, (v) => update("featureCards", v))} />
              <Input placeholder="Description" value={card.description} onChange={(e) => updateArrayItem(draft.featureCards, i, { ...card, description: e.target.value }, (v) => update("featureCards", v))} />
            </div>
            <Button variant="ghost" size="icon" onClick={() => update("featureCards", draft.featureCards.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => update("featureCards", [...draft.featureCards, { icon: "✨", title: "", description: "" }])}><Plus className="h-4 w-4 mr-1" /> Add card</Button>
        <Field label="Footer text" value={draft.featuresFooter} onChange={(v) => update("featuresFooter", v)} multi />
        <Field label="CTA text" value={draft.featuresCtaText} onChange={(v) => update("featuresCtaText", v)} />
      </section>

      {/* ── Why This Works ── */}
      <section className="space-y-4">
        <SectionHeader title="Why This Works" />
        <ToggleField label="Show section" checked={draft.showWhyThisWorks} onChange={(v) => update("showWhyThisWorks", v)} />
        <Field label="Title" value={draft.whyTitle} onChange={(v) => update("whyTitle", v)} />
        <Field label="Body (separate paragraphs with blank lines)" value={draft.whyBody} onChange={(v) => update("whyBody", v)} multi />
      </section>

      {/* ── How It Works ── */}
      <section className="space-y-4">
        <SectionHeader title="How It Works" />
        <ToggleField label="Show section" checked={draft.showHowItWorks} onChange={(v) => update("showHowItWorks", v)} />
        <Field label="Title" value={draft.howTitle} onChange={(v) => update("howTitle", v)} />
        {draft.howSteps.map((step, i) => (
          <div key={i} className="space-y-1 border-l-2 border-primary/20 pl-3">
            <Input placeholder="Step title" value={step.title} onChange={(e) => updateArrayItem(draft.howSteps, i, { ...step, title: e.target.value }, (v) => update("howSteps", v))} />
            <Textarea placeholder="Description" value={step.description} onChange={(e) => updateArrayItem(draft.howSteps, i, { ...step, description: e.target.value }, (v) => update("howSteps", v))} />
          </div>
        ))}
        <Field label="Footer text" value={draft.howFooter} onChange={(v) => update("howFooter", v)} multi />
      </section>

      {/* ── Who This Is For ── */}
      <section className="space-y-4">
        <SectionHeader title="Who This Is For" />
        <ToggleField label="Show section" checked={draft.showWhoThisIsFor} onChange={(v) => update("showWhoThisIsFor", v)} />
        <Field label="Title" value={draft.whoTitle} onChange={(v) => update("whoTitle", v)} />
        <Field label="Intro text" value={draft.whoIntro} onChange={(v) => update("whoIntro", v)} multi />
        <Label className="text-xs">B2B column</Label>
        <Field label="B2B title" value={draft.whoB2b.title} onChange={(v) => update("whoB2b", { ...draft.whoB2b, title: v })} />
        {draft.whoB2b.items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input value={item} onChange={(e) => { const items = [...draft.whoB2b.items]; items[i] = e.target.value; update("whoB2b", { ...draft.whoB2b, items }); }} className="flex-1" />
            <Button variant="ghost" size="icon" onClick={() => update("whoB2b", { ...draft.whoB2b, items: draft.whoB2b.items.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => update("whoB2b", { ...draft.whoB2b, items: [...draft.whoB2b.items, ""] })}><Plus className="h-4 w-4 mr-1" /> Add B2B item</Button>
        <Label className="text-xs">B2C column</Label>
        <Field label="B2C title" value={draft.whoB2c.title} onChange={(v) => update("whoB2c", { ...draft.whoB2c, title: v })} />
        {draft.whoB2c.items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input value={item} onChange={(e) => { const items = [...draft.whoB2c.items]; items[i] = e.target.value; update("whoB2c", { ...draft.whoB2c, items }); }} className="flex-1" />
            <Button variant="ghost" size="icon" onClick={() => update("whoB2c", { ...draft.whoB2c, items: draft.whoB2c.items.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => update("whoB2c", { ...draft.whoB2c, items: [...draft.whoB2c.items, ""] })}><Plus className="h-4 w-4 mr-1" /> Add B2C item</Button>
        <Field label="Footer" value={draft.whoFooter} onChange={(v) => update("whoFooter", v)} />
        <Field label="CTA text" value={draft.whoCtaText} onChange={(v) => update("whoCtaText", v)} />
      </section>

      {/* ── Social Proof ── */}
      <section className="space-y-4">
        <SectionHeader title="Social Proof" />
        <ToggleField label="Show social proof" checked={draft.showSocialProof} onChange={(v) => update("showSocialProof", v)} />
        <Field label="Section title" value={draft.socialProofTitle} onChange={(v) => update("socialProofTitle", v)} />
        {draft.socialProofItems.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input placeholder="Name" value={item.name} onChange={(e) => updateArrayItem(draft.socialProofItems, i, { ...item, name: e.target.value }, (v) => update("socialProofItems", v))} className="w-1/3" />
            <Input placeholder="Action" value={item.action} onChange={(e) => updateArrayItem(draft.socialProofItems, i, { ...item, action: e.target.value }, (v) => update("socialProofItems", v))} className="flex-1" />
            <Button variant="ghost" size="icon" onClick={() => update("socialProofItems", draft.socialProofItems.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => update("socialProofItems", [...draft.socialProofItems, { name: "", action: "" }])}><Plus className="h-4 w-4 mr-1" /> Add item</Button>
        <Field label="Rotate speed (seconds)" value={String(draft.socialProofRotateSpeed)} onChange={(v) => update("socialProofRotateSpeed", Number(v) || 4)} />
        <Field label="Metric line" value={draft.socialProofMetric} onChange={(v) => update("socialProofMetric", v)} />
      </section>

      {/* ── Examples ── */}
      <section className="space-y-4">
        <SectionHeader title="Examples" />
        <ToggleField label="Show examples" checked={draft.showExamples} onChange={(v) => update("showExamples", v)} />
        <Field label="Section title" value={draft.examplesTitle} onChange={(v) => update("examplesTitle", v)} />
        {draft.exampleCards.map((ex, i) => (
          <div key={i} className="space-y-1 border-l-2 border-accent/20 pl-3">
            <Input placeholder="Challenge name" value={ex.challenge} onChange={(e) => updateArrayItem(draft.exampleCards, i, { ...ex, challenge: e.target.value }, (v) => update("exampleCards", v))} />
            <Input placeholder="Quiz name" value={ex.quiz} onChange={(e) => updateArrayItem(draft.exampleCards, i, { ...ex, quiz: e.target.value }, (v) => update("exampleCards", v))} />
            <div className="flex gap-2">
              <Input placeholder="B2B/B2C" value={ex.audienceBadge} onChange={(e) => updateArrayItem(draft.exampleCards, i, { ...ex, audienceBadge: e.target.value }, (v) => update("exampleCards", v))} className="w-1/2" />
              <Input placeholder="Style" value={ex.styleBadge} onChange={(e) => updateArrayItem(draft.exampleCards, i, { ...ex, styleBadge: e.target.value }, (v) => update("exampleCards", v))} className="w-1/2" />
            </div>
            <Button variant="ghost" size="sm" onClick={() => update("exampleCards", draft.exampleCards.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 mr-1" /> Remove</Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => update("exampleCards", [...draft.exampleCards, { challenge: "", quiz: "", audienceBadge: "B2B", styleBadge: "Quick Win" }])}><Plus className="h-4 w-4 mr-1" /> Add example</Button>
        <Field label="Footer text" value={draft.examplesFooter} onChange={(v) => update("examplesFooter", v)} multi />
        <Field label="CTA text" value={draft.examplesCtaText} onChange={(v) => update("examplesCtaText", v)} />
      </section>

      {/* ── Urgency ── */}
      <section className="space-y-4">
        <SectionHeader title="Urgency Section" />
        <ToggleField label="Show urgency section" checked={draft.showUrgency} onChange={(v) => update("showUrgency", v)} />
        <Field label="Urgency title" value={draft.urgencyText} onChange={(v) => update("urgencyText", v)} />
        <Field label="Body text" value={draft.urgencyBody} onChange={(v) => update("urgencyBody", v)} multi />
        <Field label="Bonus text" value={draft.urgencyBonus} onChange={(v) => update("urgencyBonus", v)} />
        <ToggleField label="Show countdown" checked={draft.showCountdown} onChange={(v) => update("showCountdown", v)} />
        <div className="space-y-2">
          <Label>Countdown target</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !countdownDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {countdownDate ? format(countdownDate, "PPP") : "Auto (next Monday)"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={countdownDate} onSelect={(d) => update("countdownTarget", d ? d.toISOString() : null)} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
        <ToggleField label="Auto-advance weekly" checked={draft.autoAdvanceCountdown} onChange={(v) => update("autoAdvanceCountdown", v)} />
        <Field label="CTA text" value={draft.urgencyCtaText} onChange={(v) => update("urgencyCtaText", v)} />
      </section>

      {/* ── FAQ ── */}
      <section className="space-y-4">
        <SectionHeader title="FAQ Section" />
        <ToggleField label="Show FAQ" checked={draft.showFaq} onChange={(v) => update("showFaq", v)} />
        <Field label="Section title" value={draft.faqTitle} onChange={(v) => update("faqTitle", v)} />
        {draft.faqItems.map((faq, i) => (
          <div key={i} className="space-y-1 border-l-2 border-border pl-3">
            <Input placeholder="Question" value={faq.question} onChange={(e) => updateArrayItem(draft.faqItems, i, { ...faq, question: e.target.value }, (v) => update("faqItems", v))} />
            <Textarea placeholder="Answer" value={faq.answer} onChange={(e) => updateArrayItem(draft.faqItems, i, { ...faq, answer: e.target.value }, (v) => update("faqItems", v))} />
            <Button variant="ghost" size="sm" onClick={() => update("faqItems", draft.faqItems.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 mr-1" /> Remove</Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => update("faqItems", [...draft.faqItems, { question: "", answer: "" }])}><Plus className="h-4 w-4 mr-1" /> Add FAQ</Button>
      </section>

      {/* ── Final CTA ── */}
      <section className="space-y-4">
        <SectionHeader title="Final CTA" />
        <Field label="Title" value={draft.finalCtaTitle} onChange={(v) => update("finalCtaTitle", v)} />
        <Field label="Body" value={draft.finalCtaBody} onChange={(v) => update("finalCtaBody", v)} multi />
        <Field label="Button text" value={draft.finalCtaButtonText} onChange={(v) => update("finalCtaButtonText", v)} />
        <Field label="Below button text" value={draft.finalCtaBelowText} onChange={(v) => update("finalCtaBelowText", v)} />
      </section>

      <Button onClick={save} className="w-full">Save Landing Page</Button>
    </div>
  );
};

/* ── Helpers ── */
function Field({ label, value, onChange, multi }: { label: string; value: string; onChange: (v: string) => void; multi?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {multi ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3">
      <Switch checked={checked} onCheckedChange={onChange} />
      <Label>{label}</Label>
    </div>
  );
}

function updateArrayItem<T>(arr: T[], index: number, newItem: T, setter: (v: T[]) => void) {
  const copy = [...arr];
  copy[index] = newItem;
  setter(copy);
}

export default CmsLanding;
