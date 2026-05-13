import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import DictatedTextarea from "@/components/dictation/DictatedTextarea";
import { Label } from "@/components/ui/label";
import {
  ArrowRight, Crown, Globe, Megaphone, Shield, Sparkles,
  TrendingUp, Users, Zap, HelpCircle, ChevronRight,
  Package, CheckCircle, Clock,
} from "lucide-react";
import { usePromoter } from "@/hooks/usePromoter";
import { useFoundingConfig } from "@/hooks/useFoundingConfig";
import { useAuth } from "@/hooks/useAuth";
import { SEO } from "@/components/SEO";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import ActivityFeed from "@/components/ActivityFeed";
import Spinner from "@/components/Spinner";
import { toast } from "sonner";

const HOW_STEPS = [
  {
    icon: Megaphone,
    title: "Promote the experience",
    desc: "Share the challenge with your audience using your unique partner link.",
  },
  {
    icon: Package,
    title: "Contribute something valuable",
    desc: "Add a resource worth $97+ to the network — a course, template, tool, or asset.",
  },
  {
    icon: Globe,
    title: "Get cross-promoted",
    desc: "We feature you and cross-promote you to other partners' audiences.",
  },
];

const VALUE_ITEMS = [
  "Cross-promotion to other partners' audiences",
  "Feature placement inside the challenge",
  "Referral rewards (2-level system)",
  "Access to Builder Circle",
  "Network-driven audience growth",
];

const CONTRIBUTION_EXAMPLES = [
  "A lead magnet or resource guide",
  "A course or training",
  "A workshop or live session",
  "A template, tool, or framework",
  "Access to a paid asset",
];

const EARLY_BENEFITS = [
  "Founding partner status",
  "Priority visibility across the network",
  "Larger network ownership as it scales",
];

const Partners = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { promoter, loading: promoLoading } = usePromoter();
  const { slotsRemaining, loading: configLoading } = useFoundingConfig();

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingApp, setExistingApp] = useState<any>(null);
  const [appLoading, setAppLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("97");
  const [url, setUrl] = useState("");

  useEffect(() => {
    trackEvent("partners_page_viewed");
  }, []);

  // Check for existing application
  useEffect(() => {
    if (!user) { setAppLoading(false); return; }
    (async () => {
      const { data } = await (supabase.from("partner_contributions") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data?.length) setExistingApp(data[0]);
      setAppLoading(false);
    })();
  }, [user]);

  const handleApply = () => {
    trackEvent("partner_application_started");
    if (!user) {
      navigate("/join?next=partners");
      return;
    }
    if (promoter) {
      navigate("/partner");
      return;
    }
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("application-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    const trimmedUrl = url.trim();
    const numValue = parseInt(value);

    if (!trimmedTitle || !trimmedDesc || !trimmedUrl) {
      toast.error("All fields are required");
      return;
    }
    if (trimmedTitle.length > 200) {
      toast.error("Title must be under 200 characters");
      return;
    }
    if (trimmedDesc.length > 2000) {
      toast.error("Description must be under 2000 characters");
      return;
    }
    if (isNaN(numValue) || numValue < 97) {
      toast.error("Estimated value must be at least $97");
      return;
    }
    try {
      new URL(trimmedUrl);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setSubmitting(true);
    const { error } = await (supabase.from("partner_contributions") as any).insert({
      user_id: user!.id,
      contribution_title: trimmedTitle,
      contribution_description: trimmedDesc,
      estimated_value: numValue,
      contribution_url: trimmedUrl,
    });

    if (error) {
      toast.error("Failed to submit. Please try again.");
      setSubmitting(false);
      return;
    }

    trackEvent("partner_application_submitted");
    toast.success("Application submitted! We'll review it shortly.");
    setShowForm(false);
    setExistingApp({ status: "pending" });
    setSubmitting(false);
  };

  const loading = authLoading || promoLoading || configLoading || appLoading;

  // Determine CTA state
  const isPending = existingApp?.status === "pending";
  const isRejected = existingApp?.status === "rejected";
  const isApproved = !!promoter;

  return (
    <>
      <SEO title="Partner Program" description="Promote the challenge, contribute value, and grow your audience through the Leadio partner network." canonical="/partners" />
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
        {/* ─── URGENCY BANNER ─── */}
        {!loading && slotsRemaining > 0 && (
          <div className="mb-6 rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm text-foreground font-medium">
              <span className="text-primary font-bold">{slotsRemaining}</span> founding partner spot{slotsRemaining !== 1 ? "s" : ""} remaining
            </p>
          </div>
        )}

        {/* ─── HEADER ─── */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Become a Challenge Partner
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Promote the challenge. Contribute value. Grow your audience through the network.
          </p>
        </div>

        {/* ─── HOW IT WORKS ─── */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            How it works
          </h2>
          <div className="space-y-3">
            {HOW_STEPS.map((step, i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <step.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{step.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ─── WHAT YOU CONTRIBUTE ─── */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            What you contribute
          </h2>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <p className="text-sm text-foreground leading-relaxed mb-4">
                To join as a partner, you must contribute something of real value
                <span className="font-semibold"> (minimum $97 value)</span> to the network.
              </p>
              <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">
                Examples
              </p>
              <ul className="space-y-2">
                {CONTRIBUTION_EXAMPLES.map((ex, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Package className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    <span className="text-xs text-foreground">{ex}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-4 italic leading-relaxed">
                This ensures the network stays high-quality and every partner benefits.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* ─── WHAT YOU GET ─── */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            What you get
          </h2>
          <Card className="border-border">
            <CardContent className="p-5">
              <ul className="space-y-2.5">
                {VALUE_ITEMS.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Zap className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* ─── NETWORK EFFECT ─── */}
        <section className="mb-10">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-foreground mb-2">
                This is not a normal promotion
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                You're not just using your audience — you're plugging into a network where partners help grow each other's audiences.
              </p>
              <div className="flex items-center gap-2 text-xs text-foreground font-medium justify-center flex-wrap">
                <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" /> You</Badge>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant="secondary" className="gap-1">Your audience</Badge>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant="secondary" className="gap-1">Their invites</Badge>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant="secondary" className="gap-1"><TrendingUp className="h-3 w-3" /> Network growth</Badge>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3 italic">
                Every partner contributes value — this is what makes the network work.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* ─── WHY GO EARLY ─── */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Why go early
          </h2>
          <Card className="border-border">
            <CardContent className="p-5">
              <ul className="space-y-2.5">
                {EARLY_BENEFITS.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Shield className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-4 italic">
                Visibility inside the network is based on contribution and quality — not just early access.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* ─── SOCIAL PROOF ─── */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            What's happening now
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Early builders are already launching and inviting others.
          </p>
          <ActivityFeed limit={5} title="" />
        </section>

        {/* ─── CTA ─── */}
        <section className="mb-10 space-y-3">
          {loading ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : isApproved ? (
            <Button className="w-full gap-2 min-h-[48px]" onClick={() => navigate("/partner")}>
              <Crown className="h-4 w-4" /> Go to your Partner Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : isPending ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-5 flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Application submitted</p>
                  <p className="text-xs text-muted-foreground">We're reviewing your contribution. You'll be notified once approved.</p>
                </div>
              </CardContent>
            </Card>
          ) : isRejected ? (
            <>
              <Card className="border-destructive/20 bg-destructive/5 mb-2">
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-foreground mb-1">Application not approved</p>
                  <p className="text-xs text-muted-foreground">
                    {existingApp?.review_notes || "Your contribution didn't meet the requirements. You can apply again with a different asset."}
                  </p>
                </CardContent>
              </Card>
              <Button className="w-full gap-2 min-h-[48px]" onClick={handleApply}>
                <Crown className="h-4 w-4" /> Apply again
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button className="w-full gap-2 min-h-[48px]" onClick={handleApply}>
                <Crown className="h-4 w-4" /> Apply to become a partner
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 min-h-[48px]"
                onClick={() => {
                  document.getElementById("faq-section")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Learn more
              </Button>
            </>
          )}
        </section>

        {/* ─── APPLICATION FORM ─── */}
        {showForm && (
          <section id="application-form" className="mb-10">
            <Card className="border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Your contribution</h3>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="contrib-title" className="text-xs">Contribution title</Label>
                    <Input
                      id="contrib-title"
                      placeholder="e.g. SaaS Launch Playbook"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={200}
                      className="min-h-[44px]"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contrib-desc" className="text-xs">Description</Label>
                    <DictatedTextarea
                      id="contrib-desc"
                      placeholder="What is it, who is it for, and what value does it deliver?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={2000}
                      rows={3}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contrib-value" className="text-xs">Estimated value (USD, minimum $97)</Label>
                    <Input
                      id="contrib-value"
                      type="number"
                      min={97}
                      placeholder="97"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="min-h-[44px]"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contrib-url" className="text-xs">Link to resource</Label>
                    <Input
                      id="contrib-url"
                      type="url"
                      placeholder="https://..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="min-h-[44px]"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2 min-h-[48px]" disabled={submitting}>
                    {submitting ? <Spinner size="sm" /> : (
                      <>
                        <CheckCircle className="h-4 w-4" /> Submit application
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>
        )}

        {/* ─── OBJECTION HANDLING / FAQ ─── */}
        <section id="faq-section" className="mb-6 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Common questions
          </h2>
          <Card className="border-border">
            <CardContent className="p-5">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Why do I need to contribute something?
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Because this is a shared growth network — every partner brings value, so everyone benefits.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-5">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Do I have to go first?
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Early partners receive more visibility and lock in their network earlier — but growth continues as the network expands.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Partners;
