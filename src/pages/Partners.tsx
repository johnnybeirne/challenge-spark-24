import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Crown, Globe, Megaphone, Shield, Sparkles,
  TrendingUp, Users, Zap, HelpCircle, ChevronRight,
} from "lucide-react";
import { usePromoter } from "@/hooks/usePromoter";
import { useFoundingConfig } from "@/hooks/useFoundingConfig";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";
import ActivityFeed from "@/components/ActivityFeed";
import Spinner from "@/components/Spinner";
import { toast } from "sonner";

const HOW_STEPS = [
  {
    icon: Megaphone,
    title: "Promote the experience",
    desc: "Share ChallengeOS with your audience using your unique partner link.",
  },
  {
    icon: Sparkles,
    title: "Get featured inside the challenge",
    desc: "We showcase your work to every builder going through the challenge.",
  },
  {
    icon: Globe,
    title: "Grow through the network",
    desc: "Get exposure to other partners' audiences — not just your own.",
  },
];

const VALUE_ITEMS = [
  "Cross-promotion to other partners' audiences",
  "Feature placement inside the challenge",
  "Referral rewards (including second-level growth)",
  "Access to Builder Circle",
  "Network-driven audience growth",
];

const EARLY_BENEFITS = [
  "Founding partner status",
  "Priority visibility across the network",
  "Larger network ownership as it scales",
];

const Partners = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { promoter, loading: promoLoading, becomePromoter } = usePromoter();
  const { slotsRemaining, loading: configLoading } = useFoundingConfig();

  useEffect(() => {
    trackEvent("partners_page_viewed");
  }, []);

  const handleBecomePartner = async () => {
    trackEvent("partners_cta_clicked");

    if (!user) {
      navigate("/join?next=partners");
      return;
    }

    if (promoter) {
      navigate("/partner");
      return;
    }

    const result = await becomePromoter();
    if (result) {
      trackEvent("promoter_joined");
      toast.success("Welcome aboard, partner! 🎉");
      navigate("/partner");
    } else {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const loading = authLoading || promoLoading || configLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[480px] mx-auto px-4 py-10 pb-24">
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
            Become a ChallengeOS Partner
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Promote the challenge. Grow your audience through the network.
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
              {/* Visual diagram */}
              <div className="flex items-center gap-2 text-xs text-foreground font-medium justify-center flex-wrap">
                <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" /> You</Badge>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant="secondary" className="gap-1">Your audience</Badge>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant="secondary" className="gap-1">Their invites</Badge>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant="secondary" className="gap-1"><TrendingUp className="h-3 w-3" /> Network growth</Badge>
              </div>
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
              <p className="text-[11px] text-muted-foreground mt-4 italic">
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
          ) : promoter ? (
            <Button className="w-full gap-2 min-h-[48px]" onClick={() => navigate("/partner")}>
              <Crown className="h-4 w-4" /> Go to your Partner Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button className="w-full gap-2 min-h-[48px]" onClick={handleBecomePartner}>
                <Crown className="h-4 w-4" /> Become a partner
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 min-h-[48px]"
                onClick={() => {
                  const el = document.getElementById("faq-section");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Learn more
              </Button>
            </>
          )}
        </section>

        {/* ─── OBJECTION HANDLING / FAQ ─── */}
        <section id="faq-section" className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Common question
          </h2>
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
