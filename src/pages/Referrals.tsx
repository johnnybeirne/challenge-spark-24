import { useState } from "react";
import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, MessageCircle, Mail, Users, CheckCircle, TrendingUp, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { shareOrCopy } from "@/lib/share";
import EmptyState from "@/components/EmptyState";
import { memoryShareText } from "@/lib/personalisation";

const Referrals = () => {
  const { state } = useAppState();
  const [copied, setCopied] = useState(false);

  const inviteCode = state.user?.inviteCode ?? "builder";
  const referralLink = `${window.location.origin}/assess?ref=${inviteCode}`;
  const shareText = memoryShareText(state.memory);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast("Link copied! Share it with your network.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + "\n\n" + referralLink)}`;
    window.open(url, "_blank");
  };

  const shareEmail = () => {
    const subject = encodeURIComponent("Quick assessment on audience growth");
    const body = encodeURIComponent(shareText + "\n\n" + referralLink);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const direct = state.network.direct;
  const indirect = state.network.indirect;
  const totalNetwork = direct + indirect;
  const score = direct * 3 + indirect * 1;
  const referralCredits = (state.credits?.awardedActions ?? []).filter((id) => id.startsWith("referral_join_")).length * 50;
  const pendingReferralCredits = Math.max(0, direct * 100 - referralCredits);
  const creditActivity = state.credits?.activity ?? [];

  const unlockThresholds = [
    { count: 3, label: "Trust growth playbook", value: "$147" },
    { count: 5, label: "AI prompt pack", value: "$97" },
    { count: 10, label: "Full system", value: "$297" },
  ];

  const hasActivity = direct > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="app-page-container py-8 pb-24">
        <h1 className="text-2xl font-bold text-foreground mb-1">Referrals</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Invite the right people. When they join and take action, your credits grow.
        </p>

        {!hasActivity && (
          <EmptyState
            icon={Users}
            title="No referrals yet"
            description="Invite your first person to start building momentum."
          />
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(320px,0.45fr)] lg:items-start">
        <div>
        {/* Stats */}
        <Card className="border-border mb-4">
          <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">
                {direct}
              </p>
              <p className="text-xs text-muted-foreground">
                {direct} direct · {indirect} indirect builders
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{referralCredits}</p>
              <p className="text-xs text-muted-foreground">credits earned from referrals</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{pendingReferralCredits}</p>
              <p className="text-xs text-muted-foreground">pending referral credits</p>
            </div>
          </CardContent>
        </Card>

        {/* Your Impact */}
        <Card className="border-border mb-4 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Your impact</h2>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              You invited <strong className="text-primary">{direct}</strong> builder{direct !== 1 ? "s" : ""}.
              {" "}They invited <strong className="text-primary">{indirect}</strong> more.
            </p>
            <p className="text-sm text-foreground mt-1">
              You've helped grow the ecosystem by{" "}
              <strong className="text-primary">{totalNetwork}</strong> builder{totalNetwork !== 1 ? "s" : ""}.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This is what network-based growth looks like when builders help builders.
            </p>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Network score: <strong className="text-foreground">{score}</strong>{" "}
                <span className="opacity-60">({direct}×3 + {indirect}×1)</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Referral milestones */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground mb-3">Builder milestones</p>
            <div className="space-y-2">
              {unlockThresholds.map((t) => {
                const reached = direct >= t.count;
                return (
                  <div key={t.count} className="flex items-center gap-2 text-sm">
                    {reached ? (
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
                    )}
                    <span className={reached ? "text-foreground" : "text-muted-foreground"}>
                      {t.count} builders → {t.label}
                    </span>
                    <span className="ml-auto text-xs text-primary font-medium">{t.value}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Referral records */}
        {state.referrals.records.length > 0 && (
          <Card className="border-border mb-6">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground mb-3">Recent builders</p>
              <div className="space-y-2">
                {state.referrals.records.slice(-5).reverse().map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{r.invited_email}</span>
                    <span className="text-xs text-primary">joined</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium text-muted-foreground">Credit activity</p>
            </div>
            {creditActivity.length ? (
              <div className="space-y-3">
                {creditActivity.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
                    <span className="text-foreground">{item.label}</span>
                    <span className="shrink-0 font-bold text-primary">+{item.credits}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">You’ll see credit momentum here as referrals join and take action.</p>
            )}
          </CardContent>
        </Card>

        </div>
        <div>
        {/* Link */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground mb-2">Your referral link</p>
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2.5">
              <code className="text-xs text-foreground flex-1 truncate">{referralLink}</code>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={copyLink}>
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Share message */}
        <Card className="border-border mb-6">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground mb-2">Share message</p>
            <p className="text-sm text-foreground italic">"{shareText}"</p>
          </CardContent>
        </Card>

        {/* Buttons */}
        <div className="space-y-3">
          <Button className="w-full gap-2" onClick={() => {
            shareOrCopy({ text: shareText, url: referralLink });
          }}>
            <Share2 className="h-4 w-4" />
            Share my link
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={copyLink}>
            <Copy className="h-4 w-4" />
            Copy Link
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={shareWhatsApp}>
            <MessageCircle className="h-4 w-4" />
            Share on WhatsApp
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={shareEmail}>
            <Mail className="h-4 w-4" />
            Share via Email
          </Button>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Referrals;
