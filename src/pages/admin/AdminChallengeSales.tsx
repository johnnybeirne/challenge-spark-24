import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { invalidatePage } from "@/hooks/useSiteContent";
import {
  CHALLENGE_SALES_KEY,
  CHALLENGE_SALES_PAGE,
  CHALLENGE_SALES_SECTION,
  byPosition,
  newId,
  parseChallengeSales,
  resolveSectionOrder,
  type ChallengeSalesContent,
} from "@/lib/challengeSalesContent";

type C = ChallengeSalesContent;

const SECTION_NAMES: Record<string, string> = {"hero": "Hero", "video": "Video", "liveObjection": "The live objection", "problem": "The problem", "fix": "The fix", "imagine": "Imagine", "days": "Day by day", "walkAway": "What you walk away with", "whoFor": "Who it"s for", "guide": x guiding you", "testimonials": "Testimonials", "ifYouDont": "If you don"t", "faq": "FAQ", "finalCall": "Final call"};

const Field = ({ label, value, onChange, long }: { label: string; value: string; onChange: (v: string) => void; long?: boolean }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    {long ? <Textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} /> : <Input value={value} onChange={(e) => onChange(e.target.value)} />}
  </div>
);

function ListEditor<T extends { id: string; position: number }>({
  label, items, onChange, blank, render,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  blank: () => Omit<T, "id" | "position">;
  render: (item: T, set: (patch: Partial<T>) => void) => React.ReactNode;
}) {
  const sorted = byPosition(items);
  const commit = (arr: T[]) => onChange(arr.map((it, i) => ({ ...it, position: i })));
  const move = (i: number, d: number) => {
    const arr = [...sorted];
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    commit(arr);
  };
  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      {sorted.map((item, i) => (
        <div key={item.id} className="space-y-3 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Item {i + 1}</span>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === sorted.length - 1}><ArrowDown className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => commit(sorted.filter((x) => x.id !== item.id))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          {render(item, (patch) => commit(sorted.map((x) => (x.id === item.id ? { ...x, ...patch } : x))))}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => commit([...sorted, { ...(blank() as any), id: newId(), position: sorted.length }])}>
        <Plus className="mr-1 h-4 w-4" />Add
      </Button>
    </div>
  );
}

const Section = ({ title, show, onShow, children }: { title: string; show: boolean; onShow: (v: boolean) => void; children: React.ReactNode }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0">
      <CardTitle className="text-lg">{title}</CardTitle>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">Show <Switch checked={show} onCheckedChange={onShow} /></label>
    </CardHeader>
    <CardContent className="space-y-4">{children}</CardContent>
  </Card>
);

const AdminChallengeSales = () => {
  const [c, setC] = useState<C | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("value")
      .eq("page", CHALLENGE_SALES_PAGE)
      .eq("section", CHALLENGE_SALES_SECTION)
      .eq("key", CHALLENGE_SALES_KEY)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error("Could not load the page text");
        setC(parseChallengeSales(data?.value));
      });
  }, []);

  const set = <K extends keyof C>(k: K, patch: Partial<C[K]>) => setC((p) => (p ? { ...p, [k]: { ...p[k], ...patch } } : p));

  const save = async () => {
    if (!c) return;
    setSaving(true);
    const { error } = await supabase.from("site_content").upsert(
      {
        page: CHALLENGE_SALES_PAGE,
        section: CHALLENGE_SALES_SECTION,
        key: CHALLENGE_SALES_KEY,
        value: JSON.stringify(c),
        value_type: "json",
        label: "Challenge sales page",
        sort_order: 0,
      },
      { onConflict: "page,section,key" },
    );
    setSaving(false);
    if (error) return toast.error("Could not save");
    invalidatePage(CHALLENGE_SALES_PAGE);
    toast.success("Saved");
  };

  if (!c) return <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Challenge Sales Page</h1>
          <p className="text-sm text-muted-foreground">Every word on /challenge and the sign-up page. Type {"{day}"} to show the day two days from today, for example Saturday.</p>
        </div>
        <Button variant="outline" onClick={() => window.open("/challenge", "_blank", "noopener")}>
          <ExternalLink className="mr-1 h-4 w-4" />Preview
        </Button>
      </div>

      <Section title="1. Hero" show={c.hero.show} onShow={(v) => set("hero", { show: v })}>
        <Field label="Kicker" value={c.hero.kicker} onChange={(v) => set("hero", { kicker: v })} />
        <Field label="Headline" value={c.hero.headline} onChange={(v) => set("hero", { headline: v })} />
        <Field label="Subheadline" long value={c.hero.subheadline} onChange={(v) => set("hero", { subheadline: v })} />
        <Field label="Button text" value={c.hero.button} onChange={(v) => set("hero", { button: v })} />
        <Field label="Line under the button" value={c.hero.underButton} onChange={(v) => set("hero", { underButton: v })} />
      </Section>

      <Section title="2. Video (hidden until a link is added)" show={c.video.show} onShow={(v) => set("video", { show: v })}>
        <Field label="Heading" value={c.video.heading} onChange={(v) => set("video", { heading: v })} />
        <Field label="Video link (YouTube, Vimeo, or a direct .mp4, .webm or .ogg file)" value={c.video.videoUrl} onChange={(v) => set("video", { videoUrl: v })} />
      </Section>

      <Section title="3. The live objection" show={c.liveObjection.show} onShow={(v) => set("liveObjection", { show: v })}>
        <Field label="Heading" value={c.liveObjection.heading} onChange={(v) => set("liveObjection", { heading: v })} />
        <Field label="Body" long value={c.liveObjection.body} onChange={(v) => set("liveObjection", { body: v })} />
        <ListEditor label="Points" items={c.liveObjection.items} onChange={(items) => set("liveObjection", { items })} blank={() => ({ title: "", body: "" })}
          render={(it, s) => (<><Field label="Title" value={it.title} onChange={(v) => s({ title: v })} /><Field label="Text" long value={it.body} onChange={(v) => s({ body: v })} /></>)} />
        <Field label="Closing line" long value={c.liveObjection.closing} onChange={(v) => set("liveObjection", { closing: v })} />
      </Section>

      <Section title="4. The problem" show={c.problem.show} onShow={(v) => set("problem", { show: v })}>
        <Field label="Heading" value={c.problem.heading} onChange={(v) => set("problem", { heading: v })} />
        <Field label="Body" long value={c.problem.body} onChange={(v) => set("problem", { body: v })} />
        <ListEditor label="Cards" items={c.problem.cards} onChange={(cards) => set("problem", { cards })} blank={() => ({ title: "", body: "" })}
          render={(it, s) => (<><Field label="Card title" value={it.title} onChange={(v) => s({ title: v })} /><Field label="Card text" long value={it.body} onChange={(v) => s({ body: v })} /></>)} />
      </Section>

      <Section title="5. The fix" show={c.fix.show} onShow={(v) => set("fix", { show: v })}>
        <Field label="Heading" value={c.fix.heading} onChange={(v) => set("fix", { heading: v })} />
        <Field label="Body" long value={c.fix.body} onChange={(v) => set("fix", { body: v })} />
        <ListEditor label="Numbered steps" items={c.fix.items} onChange={(items) => set("fix", { items })} blank={() => ({ text: "" })}
          render={(it, s) => <Field label="Text" long value={it.text} onChange={(v) => s({ text: v })} />} />
      </Section>

      <Section title="6. Imagine" show={c.imagine.show} onShow={(v) => set("imagine", { show: v })}>
        <Field label="Heading" value={c.imagine.heading} onChange={(v) => set("imagine", { heading: v })} />
        <ListEditor label="Paragraphs" items={c.imagine.paragraphs} onChange={(paragraphs) => set("imagine", { paragraphs })} blank={() => ({ text: "" })}
          render={(it, s) => <Field label="Text" long value={it.text} onChange={(v) => s({ text: v })} />} />
      </Section>

      <Section title="7. Day by day" show={c.days.show} onShow={(v) => set("days", { show: v })}>
        <Field label="Heading" value={c.days.heading} onChange={(v) => set("days", { heading: v })} />
        <Field label="Body" long value={c.days.body} onChange={(v) => set("days", { body: v })} />
        <ListEditor label="Days" items={c.days.items} onChange={(items) => set("days", { items })} blank={() => ({ title: "", body: "" })}
          render={(it, s) => (<><Field label="Day title" value={it.title} onChange={(v) => s({ title: v })} /><Field label="Day text" long value={it.body} onChange={(v) => s({ body: v })} /></>)} />
      </Section>

      <Section title="8. What you walk away with" show={c.walkAway.show} onShow={(v) => set("walkAway", { show: v })}>
        <Field label="Heading" value={c.walkAway.heading} onChange={(v) => set("walkAway", { heading: v })} />
        <ListEditor label="Items" items={c.walkAway.items} onChange={(items) => set("walkAway", { items })} blank={() => ({ text: "" })}
          render={(it, s) => <Field label="Text" value={it.text} onChange={(v) => s({ text: v })} />} />
      </Section>

      <Section title="9. Who it's for" show={c.whoFor.show} onShow={(v) => set("whoFor", { show: v })}>
        <Field label="Heading (for)" value={c.whoFor.forHeading} onChange={(v) => set("whoFor", { forHeading: v })} />
        <ListEditor label="This is for you if" items={c.whoFor.forItems} onChange={(forItems) => set("whoFor", { forItems })} blank={() => ({ text: "" })}
          render={(it, s) => <Field label="Text" value={it.text} onChange={(v) => s({ text: v })} />} />
        <Field label="Heading (not for)" value={c.whoFor.notForHeading} onChange={(v) => set("whoFor", { notForHeading: v })} />
        <ListEditor label="It's not for you if" items={c.whoFor.notForItems} onChange={(notForItems) => set("whoFor", { notForItems })} blank={() => ({ text: "" })}
          render={(it, s) => <Field label="Text" value={it.text} onChange={(v) => s({ text: v })} />} />
      </Section>

      <Section title="10. Who's guiding you" show={c.guide.show} onShow={(v) => set("guide", { show: v })}>
        <div className="space-y-1.5">
          <Label>Photo (optional, hidden when empty)</Label>
          {c.guide.photoUrl && <img src={c.guide.photoUrl} alt="" className="h-24 w-24 rounded-full object-cover" />}
          <div className="flex flex-wrap items-center gap-2">
            <Input type="file" accept="image/*" className="max-w-xs" disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setUploading(true);
                try {
                  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
                  const path = `challenge-sales/${Date.now()}.${ext}`;
                  const { error } = await supabase.storage.from("site-images").upload(path, file, { cacheControl: "3600", contentType: file.type });
                  if (error) throw error;
                  const { data } = supabase.storage.from("site-images").getPublicUrl(path);
                  set("guide", { photoUrl: data.publicUrl });
                  toast.success("Photo uploaded. Press Save to publish it.");
                } catch {
                  toast.error("Upload failed. Try again.");
                } finally {
                  setUploading(false);
                }
              }} />
            {c.guide.photoUrl && <Button variant="ghost" size="sm" onClick={() => set("guide", { photoUrl: "" })}>Remove photo</Button>}
          </div>
        </div>
        <Field label="Heading" value={c.guide.heading} onChange={(v) => set("guide", { heading: v })} />
        <Field label="Body" long value={c.guide.body} onChange={(v) => set("guide", { body: v })} />
      </Section>

      <Section title="11. Testimonials (hidden until you add one)" show={c.testimonials.show} onShow={(v) => set("testimonials", { show: v })}>
        <Field label="Heading" value={c.testimonials.heading} onChange={(v) => set("testimonials", { heading: v })} />
        <ListEditor label="Testimonials" items={c.testimonials.items} onChange={(items) => set("testimonials", { items })} blank={() => ({ quote: "", name: "", role: "" })}
          render={(it, s) => (<><Field label="Quote" long value={it.quote} onChange={(v) => s({ quote: v })} /><Field label="Name" value={it.name} onChange={(v) => s({ name: v })} /><Field label="Role or business (optional)" value={it.role} onChange={(v) => s({ role: v })} /></>)} />
      </Section>

      <Section title="12. If you don't" show={c.ifYouDont.show} onShow={(v) => set("ifYouDont", { show: v })}>
        <Field label="Heading" value={c.ifYouDont.heading} onChange={(v) => set("ifYouDont", { heading: v })} />
        <ListEditor label="Paragraphs" items={c.ifYouDont.paragraphs} onChange={(paragraphs) => set("ifYouDont", { paragraphs })} blank={() => ({ text: "" })}
          render={(it, s) => <Field label="Text" long value={it.text} onChange={(v) => s({ text: v })} />} />
      </Section>

      <Section title="13. FAQ" show={c.faq.show} onShow={(v) => set("faq", { show: v })}>
        <Field label="Heading" value={c.faq.heading} onChange={(v) => set("faq", { heading: v })} />
        <ListEditor label="Questions" items={c.faq.items} onChange={(items) => set("faq", { items })} blank={() => ({ question: "", answer: "" })}
          render={(it, s) => (<><Field label="Question" value={it.question} onChange={(v) => s({ question: v })} /><Field label="Answer" long value={it.answer} onChange={(v) => s({ answer: v })} /></>)} />
      </Section>

      <Section title="14. Final call" show={c.finalCall.show} onShow={(v) => set("finalCall", { show: v })}>
        <Field label="Heading" value={c.finalCall.heading} onChange={(v) => set("finalCall", { heading: v })} />
        <Field label="Body" long value={c.finalCall.body} onChange={(v) => set("finalCall", { body: v })} />
        <Field label="Button text" value={c.finalCall.button} onChange={(v) => set("finalCall", { button: v })} />
        <Field label="Line under the button" value={c.finalCall.underButton} onChange={(v) => set("finalCall", { underButton: v })} />
      </Section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Sign-up page (/challenge/join)</CardTitle>
          <Button variant="outline" size="sm" onClick={() => window.open("/challenge/join", "_blank", "noopener")}><ExternalLink className="mr-1 h-4 w-4" />Preview</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Kicker" value={c.join.kicker} onChange={(v) => set("join", { kicker: v })} />
          <Field label="Headline" value={c.join.headline} onChange={(v) => set("join", { headline: v })} />
          <Field label="Subheadline" long value={c.join.subheadline} onChange={(v) => set("join", { subheadline: v })} />
          <Field label="Button text" value={c.join.button} onChange={(v) => set("join", { button: v })} />
          <Field label="Line under the button" value={c.join.underButton} onChange={(v) => set("join", { underButton: v })} />
          <label className="flex items-center gap-2 text-sm">Show the day by day summary <Switch checked={c.join.showDays} onCheckedChange={(v) => set("join", { showDays: v })} /></label>
          <Field label="Day by day heading" value={c.join.daysHeading} onChange={(v) => set("join", { daysHeading: v })} />
          <p className="text-sm text-muted-foreground">The days themselves come from section 7 above.</p>
        </CardContent>
      </Card>

      <Section title="Sign-up page: why a challenge" show={c.joinProblem.show} onShow={(v) => set("joinProblem", { show: v })}>
        <Field label="Small label" value={c.joinProblem.eyebrow} onChange={(v) => set("joinProblem", { eyebrow: v })} />
        <Field label="Heading" value={c.joinProblem.heading} onChange={(v) => set("joinProblem", { heading: v })} />
        <Field label="Body" long value={c.joinProblem.body} onChange={(v) => set("joinProblem", { body: v })} />
        <ListEditor label="Cards" items={c.joinProblem.cards} onChange={(cards) => set("joinProblem", { cards })} blank={() => ({ title: "", body: "" })}
          render={(it, s) => (<><Field label="Card title" value={it.title} onChange={(v) => s({ title: v })} /><Field label="Card text" long value={it.body} onChange={(v) => s({ body: v })} /></>)} />
      </Section>

      <Section title="Sign-up page: what you walk away with" show={c.joinBenefits.show} onShow={(v) => set("joinBenefits", { show: v })}>
        <Field label="Small label" value={c.joinBenefits.eyebrow} onChange={(v) => set("joinBenefits", { eyebrow: v })} />
        <Field label="Heading" value={c.joinBenefits.heading} onChange={(v) => set("joinBenefits", { heading: v })} />
        <ListEditor label="Items" items={c.joinBenefits.items} onChange={(items) => set("joinBenefits", { items })} blank={() => ({ text: "" })}
          render={(it, s) => <Field label="Text" value={it.text} onChange={(v) => s({ text: v })} />} />
      </Section>

      <Section title="Sign-up page: about me" show={c.joinAbout.show} onShow={(v) => set("joinAbout", { show: v })}>
        <div className="space-y-1.5">
          <Label>Photo (your quiz page photo is used until you upload one)</Label>
          {c.joinAbout.photoUrl && <img src={c.joinAbout.photoUrl} alt="" className="h-28 w-24 rounded-lg object-cover" />}
          <div className="flex flex-wrap items-center gap-2">
            <Input type="file" accept="image/*" className="max-w-xs" disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setUploading(true);
                try {
                  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
                  const path = `challenge-join/${Date.now()}.${ext}`;
                  const { error } = await supabase.storage.from("site-images").upload(path, file, { cacheControl: "3600", contentType: file.type });
                  if (error) throw error;
                  const { data } = supabase.storage.from("site-images").getPublicUrl(path);
                  set("joinAbout", { photoUrl: data.publicUrl });
                  toast.success("Photo uploaded. Press Save to publish it.");
                } catch {
                  toast.error("Upload failed. Try again.");
                } finally {
                  setUploading(false);
                }
              }} />
            {c.joinAbout.photoUrl && <Button variant="ghost" size="sm" onClick={() => set("joinAbout", { photoUrl: "" })}>Remove photo</Button>}
          </div>
        </div>
        <Field label="Small label" value={c.joinAbout.eyebrow} onChange={(v) => set("joinAbout", { eyebrow: v })} />
        <Field label="Heading" value={c.joinAbout.heading} onChange={(v) => set("joinAbout", { heading: v })} />
        <Field label="About text (leave a blank line between paragraphs)" long value={c.joinAbout.body} onChange={(v) => set("joinAbout", { body: v })} />
      </Section>

      <Section title="Sign-up page: testimonials (hidden until you add one)" show={c.joinTestimonials.show} onShow={(v) => set("joinTestimonials", { show: v })}>
        <Field label="Small label" value={c.joinTestimonials.eyebrow} onChange={(v) => set("joinTestimonials", { eyebrow: v })} />
        <Field label="Heading" value={c.joinTestimonials.heading} onChange={(v) => set("joinTestimonials", { heading: v })} />
        <ListEditor label="Testimonials" items={c.joinTestimonials.items} onChange={(items) => set("joinTestimonials", { items })} blank={() => ({ quote: "", name: "", role: "" })}
          render={(it, s) => (<><Field label="Quote" long value={it.quote} onChange={(v) => s({ quote: v })} /><Field label="Name" value={it.name} onChange={(v) => s({ name: v })} /><Field label="Role or business (optional)" value={it.role} onChange={(v) => s({ role: v })} /></>)} />
      </Section>

      <Section title="Sign-up page: final call" show={c.joinFinal.show} onShow={(v) => set("joinFinal", { show: v })}>
        <Field label="Heading" value={c.joinFinal.heading} onChange={(v) => set("joinFinal", { heading: v })} />
        <Field label="Body" long value={c.joinFinal.body} onChange={(v) => set("joinFinal", { body: v })} />
        <Field label="Button text (takes them back up to the form)" value={c.joinFinal.button} onChange={(v) => set("joinFinal", { button: v })} />
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl justify-end gap-2">
          <Button variant="outline" onClick={() => window.open("/challenge", "_blank", "noopener")}>Preview</Button>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Save</Button>
        </div>
      </div>
    </div>
  );
};

export default AdminChallengeSales;
