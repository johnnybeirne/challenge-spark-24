import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Spinner from "@/components/Spinner";
import {
  CmsPageHeader,
  EditorCard,
  EditableField,
  RepeatableList,
  StickyActionBar,
  FieldLabel,
} from "@/components/cms/cms-ui";
import {
  useAllAccessPages,
  ACCESS_PAGE_LABELS,
  ACCESS_PAGE_ROUTES,
  type AccessPageContent,
  type AccessPageKey,
} from "@/hooks/useAccessPage";
import { ACCESS_ICON_OPTIONS, getAccessIcon } from "@/lib/accessPageIcons";

const ORDER: AccessPageKey[] = ["training", "community", "events"];

const AdminAccessPages = () => {
  const { pages, setPages, loading } = useAllAccessPages();
  const [saving, setSaving] = useState(false);

  const patch = (key: AccessPageKey, changes: Partial<AccessPageContent>) =>
    setPages((prev) => prev.map((p) => (p.page_key === key ? { ...p, ...changes } : p)));

  const save = async (page: AccessPageContent) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("access_pages")
        .update({
          header_text: page.header_text,
          intro_text: page.intro_text,
          referral_heading: page.referral_heading,
          referral_copy: page.referral_copy,
          items: page.items,
        })
        .eq("id", page.id);
      if (error) throw error;
      toast.success(`${ACCESS_PAGE_LABELS[page.page_key]} page saved`);
    } catch (e: any) {
      toast.error("Could not save: " + (e?.message ?? "unknown error"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const sorted = ORDER.map((k) => pages.find((p) => p.page_key === k)).filter(Boolean) as AccessPageContent[];

  return (
    <div className="space-y-6 px-6 py-6 max-w-3xl">
      <CmsPageHeader
        title="Access pages"
        description="Edit the welcome content for Training, Community, and Events. Each page keeps its own text. Use {{first_name}} anywhere to greet the participant by name."
      />

      <Tabs defaultValue={sorted[0]?.page_key ?? "training"}>
        <TabsList>
          {sorted.map((p) => (
            <TabsTrigger key={p.page_key} value={p.page_key}>
              {ACCESS_PAGE_LABELS[p.page_key]}
            </TabsTrigger>
          ))}
        </TabsList>

        {sorted.map((page) => (
          <TabsContent key={page.page_key} value={page.page_key} className="space-y-6 pt-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <a href={ACCESS_PAGE_ROUTES[page.page_key]} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 h-4 w-4" /> Preview page
                </a>
              </Button>
            </div>

            <EditorCard title="Header" description="The big welcome heading at the top of the page.">
              <EditableField
                label="Header text"
                helper="Shown as the page heading. {{first_name}} inserts the participant's first name."
                value={page.header_text}
                onChange={(v) => patch(page.page_key, { header_text: v })}
              />
            </EditorCard>

            <EditorCard title="Intro" description="The paragraph directly beneath the header.">
              <EditableField
                label="Intro block"
                helper="A short welcome message. {{first_name}} works here too."
                value={page.intro_text}
                onChange={(v) => patch(page.page_key, { intro_text: v })}
                multiline
                rows={5}
              />
            </EditorCard>

            <EditorCard
              title="Invite link block"
              description="The highlighted invite block. The link itself is filled in automatically for each participant."
            >
              <EditableField
                label="Heading"
                value={page.referral_heading}
                onChange={(v) => patch(page.page_key, { referral_heading: v })}
              />
              <EditableField
                label="Supporting copy"
                helper="One line that motivates them to share."
                value={page.referral_copy}
                onChange={(v) => patch(page.page_key, { referral_copy: v })}
                multiline
                rows={3}
              />
            </EditorCard>

            <EditorCard
              title="Text items"
              description="Short informational items shown around the invite block. Icon, heading, and one line of copy."
            >
              <RepeatableList
                items={page.items}
                addLabel="Add text item"
                emptyText="No text items yet."
                itemLabel={(i) => `Item ${i + 1}`}
                onAdd={() =>
                  patch(page.page_key, {
                    items: [...page.items, { icon: "Sparkles", heading: "", copy: "" }],
                  })
                }
                onRemove={(i) =>
                  patch(page.page_key, { items: page.items.filter((_, idx) => idx !== i) })
                }
                renderItem={(item, i) => {
                  const move = (dir: -1 | 1) => {
                    const next = [...page.items];
                    const target = i + dir;
                    if (target < 0 || target >= next.length) return;
                    [next[i], next[target]] = [next[target], next[i]];
                    patch(page.page_key, { items: next });
                  };
                  const setItem = (changes: Partial<typeof item>) =>
                    patch(page.page_key, {
                      items: page.items.map((it, idx) => (idx === i ? { ...it, ...changes } : it)),
                    });
                  const Icon = getAccessIcon(item.icon);
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => move(-1)} disabled={i === 0}>
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => move(1)}
                          disabled={i === page.items.length - 1}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <span className="text-xs text-muted-foreground">Move this item up or down</span>
                      </div>

                      <div className="space-y-1.5">
                        <FieldLabel label="Icon" helper="Pick the small symbol shown above the heading." />
                        <div className="flex flex-wrap gap-1.5">
                          {ACCESS_ICON_OPTIONS.map((name) => {
                            const Opt = getAccessIcon(name);
                            const active = item.icon === name;
                            return (
                              <button
                                key={name}
                                type="button"
                                aria-label={name}
                                onClick={() => setItem({ icon: name })}
                                className={`flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
                                  active
                                    ? "border-primary bg-primary text-white"
                                    : "border-border bg-background hover:bg-muted"
                                }`}
                              >
                                <Opt className="h-4 w-4" />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <EditableField
                        label="Heading"
                        value={item.heading}
                        onChange={(v) => setItem({ heading: v })}
                      />
                      <EditableField
                        label="Copy"
                        value={item.copy}
                        onChange={(v) => setItem({ copy: v })}
                        multiline
                        rows={2}
                      />
                      <div className="sr-only">
                        <Label>
                          <Icon className="h-3 w-3" />
                        </Label>
                      </div>
                    </div>
                  );
                }}
              />
            </EditorCard>

            <StickyActionBar
              onSave={() => save(page)}
              saving={saving}
              saveLabel={`Save ${ACCESS_PAGE_LABELS[page.page_key]} page`}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminAccessPages;
