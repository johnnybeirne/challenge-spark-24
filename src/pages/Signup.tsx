import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

const REF_SESSION_KEY = "challengeos_ref";
const PARTNER_REF_KEY = "challengeos_partner_ref";

const Signup = () => {
  const { signInWithMagicLink } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const isValid = name.trim().length > 0 && email.trim().includes("@");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);

    // Gather referral metadata
    let referredBy: string | null = null;
    let partnerRef: string | null = null;
    try {
      referredBy = sessionStorage.getItem(REF_SESSION_KEY);
      partnerRef = sessionStorage.getItem(PARTNER_REF_KEY);
    } catch {}

    const { error } = await signInWithMagicLink(email.trim().toLowerCase(), {
      name: name.trim(),
      ...(referredBy ? { referred_by: referredBy } : {}),
    });

    setLoading(false);

    if (error) {
      toast.error(error.message || "Failed to send magic link");
      return;
    }

    // Track partner conversion
    if (partnerRef) {
      (supabase.rpc as any)("process_partner_referral", { p_partner_code: partnerRef }).then(() => {});
    }

    trackEvent("signup_completed");
    setSent(true);
    toast.success("Check your email for the magic link!");
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
          <p className="text-sm text-muted-foreground mb-6">
            We sent a magic link to <strong>{email}</strong>. Click it to join the challenge.
          </p>
          <Button variant="outline" onClick={() => setSent(false)}>
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

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
                <Mail className="w-4 h-4" />
                {loading ? "Sending…" : "Send magic link"}
                <ArrowRight className="w-4 h-4" />
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                No password needed — we'll email you a secure login link.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
