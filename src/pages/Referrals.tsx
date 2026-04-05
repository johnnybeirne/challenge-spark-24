import { useState, useMemo } from "react";
import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, MessageCircle, Mail, Users, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SHARE_TEXT =
  "I took this 90-second assessment on audience growth — curious what you'd get?";

const Referrals = () => {
  const { state, setState } = useAppState();
  const [copied, setCopied] = useState(false);

  const refCode = useMemo(() => {
    if (state.user?.email) {
      return btoa(state.user.email).slice(0, 8).toUpperCase();
    }
    return "BUILDER" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }, [state.user]);

  const referralLink = `${window.location.origin}/assess?ref=${refCode}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setState((prev) => ({
        ...prev,
        referrals: { ...prev.referrals, shares: prev.referrals.shares + 1 },
      }));
      toast({ title: "Link copied!", description: "Share it with your network." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT + "\n\n" + referralLink)}`;
    window.open(url, "_blank");
    setState((prev) => ({
      ...prev,
      referrals: { ...prev.referrals, shares: prev.referrals.shares + 1 },
    }));
  };

  const shareEmail = () => {
    const subject = encodeURIComponent("Quick assessment on audience growth");
    const body = encodeURIComponent(SHARE_TEXT + "\n\n" + referralLink);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    setState((prev) => ({
      ...prev,
      referrals: { ...prev.referrals, invites: prev.referrals.invites + 1 },
    }));
  };

  const totalReferrals = state.referrals.shares + state.referrals.invites;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[480px] mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Referrals</h1>
        <p className="text-sm text-muted-foreground mb-6">
          This only works if people go through it.
        </p>

        {/* Stats */}
        <Card className="border-border mb-6">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-full bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{totalReferrals}</p>
              <p className="text-xs text-muted-foreground">
                {state.referrals.shares} shares · {state.referrals.invites} invites
              </p>
            </div>
          </CardContent>
        </Card>

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
            <p className="text-sm text-foreground italic">"{SHARE_TEXT}"</p>
          </CardContent>
        </Card>

        {/* Buttons */}
        <div className="space-y-3">
          <Button className="w-full gap-2" onClick={copyLink}>
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
  );
};

export default Referrals;
