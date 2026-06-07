import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContent } from "@/hooks/useSiteContent";

const LIST_SIZES = ["Under 500", "500 to 1k", "1k to 5k", "5k to 10k", "10k plus"] as const;

const schema = z.object({
  full_name: z.string().trim().min(1, "Required").max(200),
  email: z.string().trim().email("Enter a valid email").max(255),
  list_size: z.enum(LIST_SIZES),
  product_name: z.string().trim().min(1, "Required").max(200),
  product_url: z
    .string()
    .trim()
    .max(500)
    .optional()
    .refine((v) => !v || /^https?:\/\//i.test(v), "Must start with http(s)://"),
  retail_value: z
    .number({ invalid_type_error: "Required" })
    .min(0, "Must be ≥ 0")
    .max(1_000_000),
});

const JvApply = () => {
  const { t, loaded } = useSiteContent("jv-apply");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    list_size: "" as (typeof LIST_SIZES)[number] | "",
    product_name: "",
    product_url: "",
    retail_value: "",
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...form,
      retail_value: form.retail_value === "" ? Number.NaN : Number(form.retail_value),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Please check the form");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("jv-apply-submit", {
        body: parsed.data,
      });
      if (error || (data && (data as { error?: string }).error)) {
        toast.error((data as { error?: string })?.error || error?.message || "Submission failed");
        return;
      }
      setSubmitted(true);
      toast.success(t("form.success_message", "Application received."));
    } catch (err) {
      console.error(err);
      toast.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Apply to become a JV partner | Leadio"
        description="Apply to become a Leadio JV partner. Share your bonus, get featured on the rewards ladder, and tap into the referral network."
        canonical="/jv-apply"
      />
      <main className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-24">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-6 text-center">
            JV partner application
          </h1>

          {/* Video placeholder */}
          <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden border border-border flex items-center justify-center mb-5">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="h-14 w-14 rounded-full bg-background/80 border border-border flex items-center justify-center shadow-sm">
                <Play className="h-6 w-6 ml-0.5" />
              </div>
              <span className="text-sm font-medium">
                {t("intro.video_label", "Video coming soon")}
              </span>
            </div>
          </div>

          {/* Intro lines */}
          <p className="text-base text-foreground/90 leading-relaxed text-center mb-2">
            {t(
              "intro.line_one",
              "The bigger your bonus, the more incentivised your audience will be to promote.",
            )}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed text-center mb-8">
            {t(
              "intro.line_two",
              "Don't worry about list size. Every person you send in invites new people. The network grows itself.",
            )}
          </p>

          {submitted ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 text-center">
              <p className="text-base font-semibold text-foreground mb-1">
                {t("form.success_message", "Application received. We'll be in touch shortly.")}
              </p>
              <p className="text-xs text-muted-foreground">
                A confirmation email is on its way to {form.email}.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5 bg-card border border-border rounded-lg p-5 sm:p-6 shadow-sm">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">
                  {t("form.label_full_name", "Full name")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="full_name"
                  required
                  maxLength={200}
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">
                  {t("form.label_email", "Email address")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  maxLength={255}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="list_size">
                  {t("form.label_list_size", "Approximate list size")}
                </Label>
                <Select
                  value={form.list_size}
                  onValueChange={(v) =>
                    setForm({ ...form, list_size: v as (typeof LIST_SIZES)[number] })
                  }
                >
                  <SelectTrigger id="list_size">
                    <SelectValue placeholder="Select a range" />
                  </SelectTrigger>
                  <SelectContent>
                    {LIST_SIZES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product_name">
                  {t("form.label_product_name", "Paid product name")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="product_name"
                  required
                  maxLength={200}
                  value={form.product_name}
                  onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product_url">
                  {t("form.label_product_url", "Product URL")}
                </Label>
                <Input
                  id="product_url"
                  type="url"
                  maxLength={500}
                  placeholder={t("form.placeholder_product_url", "e.g. https://yourproduct.com")}
                  value={form.product_url}
                  onChange={(e) => setForm({ ...form, product_url: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="retail_value">
                  {t("form.label_retail_value", "Retail value of your product")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    id="retail_value"
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    className="pl-7"
                    value={form.retail_value}
                    onChange={(e) => setForm({ ...form, retail_value: e.target.value })}
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="w-full min-h-[48px]"
              >
                {submitting
                  ? "Submitting…"
                  : t("form.submit_label", "Apply to become a JV partner")}
              </Button>
            </form>
          )}
        </div>
      </main>
    </>
  );
};

export default JvApply;
