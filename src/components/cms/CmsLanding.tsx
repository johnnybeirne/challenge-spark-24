import { useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import {
  useSiteConfig,
  type LandingConfig,
} from "@/context/SiteConfigContext";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
  ToggleField,
  RepeatableList,
  StickyActionBar,
  FieldLabel,
} from "./cms-ui";

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

  return (
    <div className="space-y-6">
      <CmsPageHeader
        title="Landing Page"
        description="Edit the public landing page content. Changes appear in the preview after you save."
      />

      {/* Hero */}
      <EditorCard
        title="Hero Section"
        description="The first thing visitors see at the top of the page."
      >
        <EditableField
          label="Headline"
          helper="The big bold line at the top of the landing page."
          value={draft.heroHeadline}
          onChange={(v) => update("heroHeadline", v)}
        />
        <EditableField
          label="Subheadline"
          helper="Appears just below the headline."
          value={draft.heroSubheadline}
          onChange={(v) => update("heroSubheadline", v)}
          multiline
        />
        <EditableField
          label="Supporting line"
          helper="Short reinforcing line shown under the subheadline."
          value={draft.heroSupportingLine}
          onChange={(v) => update("heroSupportingLine", v)}
        />
        <EditableField
          label="Micro proof"
          helper="Tiny credibility line near the CTA (e.g. number of users)."
          value={draft.heroMicroProof}
          onChange={(v) => update("heroMicroProof", v)}
        />
        <EditableField
          label="Call-to-action button text"
          helper="The label on the main button."
          value={draft.primaryCtaText}
          onChange={(v) => update("primaryCtaText", v)}
        />
        <EditableField
          label="Call-to-action link"
          helper="Where the button sends people. Usually starts with /."
          value={draft.primaryCtaLink}
          onChange={(v) => update("primaryCtaLink", v)}
        />
        <EditableField
          label="Text below the button"
          helper="Small reassurance line under the CTA button."
          value={draft.heroBelowCtaText}
          onChange={(v) => update("heroBelowCtaText", v)}
        />
      </EditorCard>

      {/* Features */}
      <EditorCard
        title="Features Section"
        description="The grid of feature cards highlighting what's included."
      >
        <ToggleField
          label="Show this section"
          helper="Hide to remove the features section from the live page."
          checked={draft.showFeatures}
          onChange={(v) => update("showFeatures", v)}
        />
        <EditableField
          label="Section title"
          helper="Heading shown above the feature cards."
          value={draft.featuresTitle}
          onChange={(v) => update("featuresTitle", v)}
        />
        <RepeatableList
          label="Feature cards"
          helper="Each card shows an icon, a title, and a short description."
          items={draft.featureCards}
          itemLabel={(i) => `Feature ${i + 1}`}
          addLabel="Add feature card"
          onAdd={() =>
            update("featureCards", [
              ...draft.featureCards,
              { icon: "✨", title: "", description: "" },
            ])
          }
          onRemove={(i) =>
            update(
              "featureCards",
              draft.featureCards.filter((_, j) => j !== i),
            )
          }
          renderItem={(card, i) => (
            <div className="space-y-3">
              <div className="grid grid-cols-[80px_1fr] gap-3">
                <div className="space-y-1.5">
                  <FieldLabel label="Icon" helper="Emoji" />
                  <Input
                    value={card.icon}
                    className="h-11 text-center text-lg"
                    onChange={(e) =>
                      update(
                        "featureCards",
                        draft.featureCards.map((c, j) =>
                          j === i ? { ...c, icon: e.target.value } : c,
                        ),
                      )
                    }
                  />
                </div>
                <EditableField
                  label="Title"
                  value={card.title}
                  onChange={(v) =>
                    update(
                      "featureCards",
                      draft.featureCards.map((c, j) =>
                        j === i ? { ...c, title: v } : c,
                      ),
                    )
                  }
                />
              </div>
              <EditableField
                label="Description"
                value={card.description}
                multiline
                rows={2}
                onChange={(v) =>
                  update(
                    "featureCards",
                    draft.featureCards.map((c, j) =>
                      j === i ? { ...c, description: v } : c,
                    ),
                  )
                }
              />
            </div>
          )}
        />
        <EditableField
          label="Footer text"
          helper="Closing line shown under the feature cards."
          value={draft.featuresFooter}
          onChange={(v) => update("featuresFooter", v)}
          multiline
        />
        <EditableField
          label="Section CTA text"
          value={draft.featuresCtaText}
          onChange={(v) => update("featuresCtaText", v)}
        />
      </EditorCard>

      {/* Why this works */}
      <EditorCard title="Why This Works" description="Explainer block about the approach.">
        <ToggleField
          label="Show this section"
          checked={draft.showWhyThisWorks}
          onChange={(v) => update("showWhyThisWorks", v)}
        />
        <EditableField label="Title" value={draft.whyTitle} onChange={(v) => update("whyTitle", v)} />
        <EditableField
          label="Body"
          helper="Separate paragraphs with a blank line."
          value={draft.whyBody}
          onChange={(v) => update("whyBody", v)}
          multiline
          rows={5}
        />
      </EditorCard>

      {/* How it works */}
      <EditorCard
        title="How It Works"
        description="Step-by-step explanation of the user journey."
      >
        <ToggleField
          label="Show this section"
          checked={draft.showHowItWorks}
          onChange={(v) => update("showHowItWorks", v)}
        />
        <EditableField label="Title" value={draft.howTitle} onChange={(v) => update("howTitle", v)} />
        <RepeatableList
          label="Steps"
          items={draft.howSteps}
          itemLabel={(i) => `Step ${i + 1}`}
          addLabel="Add step"
          onAdd={() => update("howSteps", [...draft.howSteps, { title: "", description: "" }])}
          onRemove={(i) => update("howSteps", draft.howSteps.filter((_, j) => j !== i))}
          renderItem={(step, i) => (
            <div className="space-y-3">
              <EditableField
                label="Step title"
                value={step.title}
                onChange={(v) =>
                  update(
                    "howSteps",
                    draft.howSteps.map((s, j) => (j === i ? { ...s, title: v } : s)),
                  )
                }
              />
              <EditableField
                label="Description"
                value={step.description}
                multiline
                rows={2}
                onChange={(v) =>
                  update(
                    "howSteps",
                    draft.howSteps.map((s, j) => (j === i ? { ...s, description: v } : s)),
                  )
                }
              />
            </div>
          )}
        />
        <EditableField
          label="Footer text"
          value={draft.howFooter}
          onChange={(v) => update("howFooter", v)}
          multiline
        />
      </EditorCard>

      {/* Who this is for */}
      <EditorCard title="Who This Is For" description="B2B and B2C audience columns.">
        <ToggleField
          label="Show this section"
          checked={draft.showWhoThisIsFor}
          onChange={(v) => update("showWhoThisIsFor", v)}
        />
        <EditableField label="Title" value={draft.whoTitle} onChange={(v) => update("whoTitle", v)} />
        <EditableField
          label="Intro text"
          value={draft.whoIntro}
          onChange={(v) => update("whoIntro", v)}
          multiline
        />

        <div className="rounded-lg border bg-background/40 p-3 space-y-3">
          <FieldLabel label="B2B column" />
          <EditableField
            label="B2B title"
            value={draft.whoB2b.title}
            onChange={(v) => update("whoB2b", { ...draft.whoB2b, title: v })}
          />
          <RepeatableList
            label="B2B items"
            items={draft.whoB2b.items}
            itemLabel={(i) => `Item ${i + 1}`}
            addLabel="Add B2B item"
            onAdd={() => update("whoB2b", { ...draft.whoB2b, items: [...draft.whoB2b.items, ""] })}
            onRemove={(i) =>
              update("whoB2b", {
                ...draft.whoB2b,
                items: draft.whoB2b.items.filter((_, j) => j !== i),
              })
            }
            renderItem={(item, i) => (
              <Input
                className="h-11 text-base"
                value={item}
                onChange={(e) => {
                  const items = [...draft.whoB2b.items];
                  items[i] = e.target.value;
                  update("whoB2b", { ...draft.whoB2b, items });
                }}
              />
            )}
          />
        </div>

        <div className="rounded-lg border bg-background/40 p-3 space-y-3">
          <FieldLabel label="B2C column" />
          <EditableField
            label="B2C title"
            value={draft.whoB2c.title}
            onChange={(v) => update("whoB2c", { ...draft.whoB2c, title: v })}
          />
          <RepeatableList
            label="B2C items"
            items={draft.whoB2c.items}
            itemLabel={(i) => `Item ${i + 1}`}
            addLabel="Add B2C item"
            onAdd={() => update("whoB2c", { ...draft.whoB2c, items: [...draft.whoB2c.items, ""] })}
            onRemove={(i) =>
              update("whoB2c", {
                ...draft.whoB2c,
                items: draft.whoB2c.items.filter((_, j) => j !== i),
              })
            }
            renderItem={(item, i) => (
              <Input
                className="h-11 text-base"
                value={item}
                onChange={(e) => {
                  const items = [...draft.whoB2c.items];
                  items[i] = e.target.value;
                  update("whoB2c", { ...draft.whoB2c, items });
                }}
              />
            )}
          />
        </div>

        <EditableField label="Footer" value={draft.whoFooter} onChange={(v) => update("whoFooter", v)} />
        <EditableField label="CTA text" value={draft.whoCtaText} onChange={(v) => update("whoCtaText", v)} />
      </EditorCard>

      {/* Social proof */}
      <EditorCard title="Social Proof" description="Rotating list of recent activity.">
        <ToggleField
          label="Show social proof"
          checked={draft.showSocialProof}
          onChange={(v) => update("showSocialProof", v)}
        />
        <EditableField
          label="Section title"
          value={draft.socialProofTitle}
          onChange={(v) => update("socialProofTitle", v)}
        />
        <RepeatableList
          label="Activity items"
          items={draft.socialProofItems}
          itemLabel={(i) => `Item ${i + 1}`}
          addLabel="Add activity item"
          onAdd={() => update("socialProofItems", [...draft.socialProofItems, { name: "", action: "" }])}
          onRemove={(i) =>
            update("socialProofItems", draft.socialProofItems.filter((_, j) => j !== i))
          }
          renderItem={(item, i) => (
            <div className="space-y-3">
              <EditableField
                label="Person name"
                value={item.name}
                onChange={(v) =>
                  update(
                    "socialProofItems",
                    draft.socialProofItems.map((s, j) => (j === i ? { ...s, name: v } : s)),
                  )
                }
              />
              <EditableField
                label="What they did"
                value={item.action}
                onChange={(v) =>
                  update(
                    "socialProofItems",
                    draft.socialProofItems.map((s, j) => (j === i ? { ...s, action: v } : s)),
                  )
                }
              />
            </div>
          )}
        />
        <EditableField
          label="Rotate speed (seconds)"
          helper="How quickly each entry rotates."
          type="number"
          value={String(draft.socialProofRotateSpeed)}
          onChange={(v) => update("socialProofRotateSpeed", Number(v) || 4)}
        />
        <EditableField
          label="Metric line"
          helper="Optional headline metric shown alongside the list."
          value={draft.socialProofMetric}
          onChange={(v) => update("socialProofMetric", v)}
        />
      </EditorCard>

      {/* Examples */}
      <EditorCard title="Examples" description="Sample challenges shown to inspire visitors.">
        <ToggleField
          label="Show examples"
          checked={draft.showExamples}
          onChange={(v) => update("showExamples", v)}
        />
        <EditableField
          label="Section title"
          value={draft.examplesTitle}
          onChange={(v) => update("examplesTitle", v)}
        />
        <RepeatableList
          label="Example cards"
          items={draft.exampleCards}
          itemLabel={(i) => `Example ${i + 1}`}
          addLabel="Add example"
          onAdd={() =>
            update("exampleCards", [
              ...draft.exampleCards,
              { challenge: "", quiz: "", audienceBadge: "B2B", styleBadge: "Quick Win" },
            ])
          }
          onRemove={(i) => update("exampleCards", draft.exampleCards.filter((_, j) => j !== i))}
          renderItem={(ex, i) => (
            <div className="space-y-3">
              <EditableField
                label="Challenge name"
                value={ex.challenge}
                onChange={(v) =>
                  update(
                    "exampleCards",
                    draft.exampleCards.map((e2, j) => (j === i ? { ...e2, challenge: v } : e2)),
                  )
                }
              />
              <EditableField
                label="Quiz name"
                value={ex.quiz}
                onChange={(v) =>
                  update(
                    "exampleCards",
                    draft.exampleCards.map((e2, j) => (j === i ? { ...e2, quiz: v } : e2)),
                  )
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <EditableField
                  label="Audience badge"
                  value={ex.audienceBadge}
                  onChange={(v) =>
                    update(
                      "exampleCards",
                      draft.exampleCards.map((e2, j) => (j === i ? { ...e2, audienceBadge: v } : e2)),
                    )
                  }
                />
                <EditableField
                  label="Style badge"
                  value={ex.styleBadge}
                  onChange={(v) =>
                    update(
                      "exampleCards",
                      draft.exampleCards.map((e2, j) => (j === i ? { ...e2, styleBadge: v } : e2)),
                    )
                  }
                />
              </div>
            </div>
          )}
        />
        <EditableField
          label="Footer text"
          value={draft.examplesFooter}
          onChange={(v) => update("examplesFooter", v)}
          multiline
        />
        <EditableField
          label="CTA text"
          value={draft.examplesCtaText}
          onChange={(v) => update("examplesCtaText", v)}
        />
      </EditorCard>

      {/* Urgency */}
      <EditorCard title="Urgency Section" description="Cohort start countdown and bonuses.">
        <ToggleField
          label="Show urgency section"
          checked={draft.showUrgency}
          onChange={(v) => update("showUrgency", v)}
        />
        <EditableField
          label="Urgency title"
          value={draft.urgencyText}
          onChange={(v) => update("urgencyText", v)}
        />
        <EditableField
          label="Body text"
          value={draft.urgencyBody}
          onChange={(v) => update("urgencyBody", v)}
          multiline
        />
        <EditableField
          label="Bonus text"
          value={draft.urgencyBonus}
          onChange={(v) => update("urgencyBonus", v)}
        />
        <ToggleField
          label="Show countdown"
          checked={draft.showCountdown}
          onChange={(v) => update("showCountdown", v)}
        />
        <div className="space-y-1.5">
          <FieldLabel
            label="Countdown target date"
            helper="When the countdown finishes. Leave on auto for next Monday."
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-11 w-full justify-start text-left font-normal",
                  !countdownDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {countdownDate ? format(countdownDate, "PPP") : "Auto (next Monday)"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={countdownDate}
                onSelect={(d) => update("countdownTarget", d ? d.toISOString() : null)}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        <ToggleField
          label="Auto-advance weekly"
          checked={draft.autoAdvanceCountdown}
          onChange={(v) => update("autoAdvanceCountdown", v)}
        />
        <EditableField
          label="CTA text"
          value={draft.urgencyCtaText}
          onChange={(v) => update("urgencyCtaText", v)}
        />
      </EditorCard>

      {/* FAQ */}
      <EditorCard title="FAQ Section" description="Common questions and answers.">
        <ToggleField label="Show FAQ" checked={draft.showFaq} onChange={(v) => update("showFaq", v)} />
        <EditableField
          label="Section title"
          value={draft.faqTitle}
          onChange={(v) => update("faqTitle", v)}
        />
        <RepeatableList
          label="FAQ items"
          items={draft.faqItems}
          itemLabel={(i) => `Question ${i + 1}`}
          addLabel="Add FAQ"
          onAdd={() => update("faqItems", [...draft.faqItems, { question: "", answer: "" }])}
          onRemove={(i) => update("faqItems", draft.faqItems.filter((_, j) => j !== i))}
          renderItem={(faq, i) => (
            <div className="space-y-3">
              <EditableField
                label="Question"
                value={faq.question}
                onChange={(v) =>
                  update(
                    "faqItems",
                    draft.faqItems.map((f, j) => (j === i ? { ...f, question: v } : f)),
                  )
                }
              />
              <EditableField
                label="Answer"
                value={faq.answer}
                multiline
                rows={3}
                onChange={(v) =>
                  update(
                    "faqItems",
                    draft.faqItems.map((f, j) => (j === i ? { ...f, answer: v } : f)),
                  )
                }
              />
            </div>
          )}
        />
      </EditorCard>

      {/* Final CTA */}
      <EditorCard title="Final CTA Section" description="The closing call-to-action at the bottom of the page.">
        <EditableField label="Title" value={draft.finalCtaTitle} onChange={(v) => update("finalCtaTitle", v)} />
        <EditableField
          label="Body"
          value={draft.finalCtaBody}
          onChange={(v) => update("finalCtaBody", v)}
          multiline
        />
        <EditableField
          label="Button text"
          value={draft.finalCtaButtonText}
          onChange={(v) => update("finalCtaButtonText", v)}
        />
        <EditableField
          label="Text below button"
          value={draft.finalCtaBelowText}
          onChange={(v) => update("finalCtaBelowText", v)}
        />
      </EditorCard>

      <StickyActionBar onSave={save} saveLabel="Save landing page" />
    </div>
  );
};

export default CmsLanding;
