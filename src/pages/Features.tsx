import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Zap, Calendar, Users, Share2, Gift, LayoutDashboard, Flame, Brain, Rocket, Shield, Globe } from "lucide-react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  category: string;
  addedAt: string;
}

function scanFeatures(): Feature[] {
  return [
    { icon: <Zap className="h-5 w-5 text-primary" />, title: "3-Day Challenge", description: "Build and launch an app in just 3 days with guided daily tasks.", category: "Core", addedAt: "2026-03-28" },
    { icon: <LayoutDashboard className="h-5 w-5 text-primary" />, title: "Dashboard", description: "Track your progress across all challenge days at a glance.", category: "Core", addedAt: "2026-03-28" },
    { icon: <Flame className="h-5 w-5 text-primary" />, title: "Daily Tasks", description: "Structured tasks for each day: Foundation → Build → Launch.", category: "Core", addedAt: "2026-03-28" },
    { icon: <Brain className="h-5 w-5 text-primary" />, title: "AI Copilot Chat", description: "Built-in AI assistant to help you through each challenge step.", category: "AI", addedAt: "2026-03-30" },
    { icon: <Globe className="h-5 w-5 text-primary" />, title: "Live URL Submission", description: "Paste your live app URL on Day 3 to prove you shipped.", category: "Launch", addedAt: "2026-03-31" },
    { icon: <Rocket className="h-5 w-5 text-primary" />, title: "Launch Celebration", description: "Celebratory screen when you complete all 3 days.", category: "Launch", addedAt: "2026-03-31" },
    { icon: <Users className="h-5 w-5 text-primary" />, title: "Builder Circle Community", description: "Gated community unlocked after launching and sharing.", category: "Community", addedAt: "2026-04-03" },
    { icon: <Share2 className="h-5 w-5 text-primary" />, title: "Referral System", description: "Share your progress and invite others to earn community access.", category: "Growth", addedAt: "2026-04-02" },
    { icon: <Gift className="h-5 w-5 text-primary" />, title: "Unlocks & Rewards", description: "Earn unlocks as you complete challenges and refer friends.", category: "Growth", addedAt: "2026-04-02" },
    { icon: <Calendar className="h-5 w-5 text-primary" />, title: "Calendar View", description: "Visual calendar to track challenge days and milestones.", category: "Core", addedAt: "2026-04-04" },
    { icon: <Shield className="h-5 w-5 text-primary" />, title: "Auth Guard", description: "Protected routes ensure only signed-up users access challenges.", category: "Security", addedAt: "2026-03-29" },
    { icon: <Zap className="h-5 w-5 text-primary" />, title: "Assessment Quiz", description: "Pre-challenge assessment to tailor your experience.", category: "Onboarding", addedAt: "2026-03-28" },
    { icon: <Users className="h-5 w-5 text-primary" />, title: "JV Partner Dashboard", description: "Track conversions, earn tiered rewards, and grow as a partner.", category: "Growth", addedAt: "2026-04-04" },
    { icon: <Rocket className="h-5 w-5 text-primary" />, title: "Loading Spinners", description: "Polished loading states with spinners and AI typing dots.", category: "Polish", addedAt: "2026-04-05" },
    { icon: <Gift className="h-5 w-5 text-primary" />, title: "Empty States", description: "Friendly illustrations when referrals or unlocks are empty.", category: "Polish", addedAt: "2026-04-05" },
    { icon: <Flame className="h-5 w-5 text-primary" />, title: "Celebration Animations", description: "Confetti bursts and checkmark pops on task & challenge completion.", category: "Polish", addedAt: "2026-04-05" },
    { icon: <Calendar className="h-5 w-5 text-primary" />, title: "Activity Feed", description: "Real-time feed showing community activity and milestones.", category: "Community", addedAt: "2026-04-04" },
    { icon: <LayoutDashboard className="h-5 w-5 text-primary" />, title: "Analytics System", description: "Event tracking, conversion funnel, and admin dashboard.", category: "Admin", addedAt: "2026-04-05" },
    { icon: <Users className="h-5 w-5 text-primary" />, title: "Two-Layer Referral Engine", description: "Promoters and participants tracked with dual-layer attribution.", category: "Growth", addedAt: "2026-04-05" },
    { icon: <Shield className="h-5 w-5 text-primary" />, title: "Promoter Admin Panel", description: "Approve promoters, adjust conversions, tag founding partners.", category: "Admin", addedAt: "2026-04-05" },
    { icon: <Flame className="h-5 w-5 text-primary" />, title: "Global Leaderboard", description: "Ranked participants and promoters with live scores.", category: "Community", addedAt: "2026-04-05" },
    { icon: <Gift className="h-5 w-5 text-primary" />, title: "Badge System", description: "Auto-awarded badges for milestones like Early Adopter and Networker.", category: "Growth", addedAt: "2026-04-05" },
    { icon: <Rocket className="h-5 w-5 text-primary" />, title: "Viral Onboarding Flow", description: "Post-signup interstitial and nudges to turn users into promoters.", category: "Onboarding", addedAt: "2026-04-05" },
    { icon: <Share2 className="h-5 w-5 text-primary" />, title: "Invite Milestone Modal", description: "Celebratory feedback when users hit 3 invites.", category: "Growth", addedAt: "2026-04-05" },
    { icon: <Zap className="h-5 w-5 text-primary" />, title: "Day 2 Invite Nudge", description: "Soft gate encouraging invites before Day 2 unlocks.", category: "Onboarding", addedAt: "2026-04-05" },
    { icon: <LayoutDashboard className="h-5 w-5 text-primary" />, title: "Promoter Dashboard", description: "Premium JV dashboard with metrics, visibility, rewards, and impact.", category: "Growth", addedAt: "2026-04-05" },
    { icon: <Globe className="h-5 w-5 text-primary" />, title: "Cross-Promotion System", description: "Promoters featured to each other's audiences based on performance.", category: "Community", addedAt: "2026-04-05" },
    { icon: <Brain className="h-5 w-5 text-primary" />, title: "Supabase Auth + Sync", description: "Magic link auth with real-time state sync to the database.", category: "Security", addedAt: "2026-04-05" },
  ];
}

const Features = () => {
  const [features, setFeatures] = useState<Feature[]>(scanFeatures);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [spinning, setSpinning] = useState(false);

  const refresh = useCallback(() => {
    setSpinning(true);
    setTimeout(() => {
      setFeatures(scanFeatures());
      setLastUpdated(new Date());
      setSpinning(false);
    }, 500);
  }, []);

  const categories = [...new Set(features.map((f) => f.category))];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[480px] mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground">App Features</h1>
          <Button variant="outline" size="sm" onClick={refresh} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          Last updated: {lastUpdated.toLocaleTimeString()} · {features.length} features detected
        </p>

        {categories.map((cat) => (
          <div key={cat} className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{cat}</h2>
            <div className="space-y-2">
              {features
                .filter((f) => f.category === cat)
                .map((f) => (
                  <Card key={f.title} className="border-border">
                    <CardContent className="flex items-start gap-3 p-4">
                      <div className="mt-0.5 shrink-0">{f.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground text-sm">{f.title}</p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{f.addedAt}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{f.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features;
