import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState, generateInviteCode, getPartnerTier } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

const REF_SESSION_KEY = "challengeos_ref";

const Signup = () => {
  const navigate = useNavigate();
  const { state, setState } = useAppState();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = name.trim().length > 0 && email.trim().includes("@");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    // Prevent self-referral
    const trimmedEmail = email.trim().toLowerCase();
    if (state.user?.email?.toLowerCase() === trimmedEmail) return;

    setLoading(true);

    const inviteCode = generateInviteCode();

    // Check for referral attribution
    let referredBy: string | null = null;
    let referredByParent: string | null = null;
    let partnerRef: string | null = null;
    try {
      referredBy = sessionStorage.getItem(REF_SESSION_KEY);
      partnerRef = sessionStorage.getItem("challengeos_partner_ref");
      sessionStorage.removeItem(REF_SESSION_KEY);
      sessionStorage.removeItem("challengeos_partner_ref");
    } catch {}

    const user = {
      name: name.trim(),
      email: trimmedEmail,
      inviteCode,
      referredBy,
      referredByParent,
      createdAt: Date.now(),
    };

    setState((prev) => {
      const next = {
        ...prev,
        user,
        challenge: { ...prev.challenge, currentDay: 1 },
        referrals: {
          ...prev.referrals,
          records: [...prev.referrals.records],
        },
      };

      // Attribution: update inviter's network counts (localStorage-only for MVP)
      // In a real system this would be a server-side operation.
      // For same-browser testing, we simulate by incrementing counts if the ref matches current user's code.
      if (referredBy && prev.user?.inviteCode === referredBy) {
        next.network = {
          ...prev.network,
          direct: prev.network.direct + 1,
        };
        next.referrals = {
          ...next.referrals,
          count: prev.referrals.count + 1,
          records: [
            ...prev.referrals.records,
            {
              invited_email: trimmedEmail,
              status: "joined" as const,
              created_at: new Date().toISOString(),
            },
          ],
        };
        toast("A builder joined through your link!");
      }

      // Partner attribution
      if (partnerRef && prev.partner.isPartner && prev.partner.partnerCode === partnerRef) {
        const newConversions = prev.partner.conversions + 1;
        next.partner = {
          ...next.partner,
          conversions: newConversions,
          tier: getPartnerTier(newConversions),
        };
        toast("Partner conversion recorded!");
      }

      return next;
    });

    trackEvent("signup_completed");
    navigate("/dashboard");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-foreground text-center mb-2">
          Start building your growth system
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Join the 3-day challenge and turn your audience into a trust-powered engine.
        </p>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  maxLength={255}
                />
              </div>

              <Button
                type="submit"
                disabled={!isValid || loading}
                className="w-full h-12 text-base rounded-xl gap-2"
              >
                {loading ? "Setting up…" : "Join the challenge"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
