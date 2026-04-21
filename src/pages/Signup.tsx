import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Mail, CheckCircle, Lock, LogIn } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

const REF_SESSION_KEY = "challengeos_ref";
const PARTNER_REF_KEY = "challengeos_partner_ref";

type Mode = "signup" | "login";

const Signup = () => {
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidLogin = email.trim().includes("@") && password.length >= 6;
  const isValidSignup = name.trim().length > 0 && isValidLogin;
  const isValid = mode === "login" ? isValidLogin : isValidSignup;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email.trim().toLowerCase(), password);
      setLoading(false);
      if (error) {
        toast.error(error.message || "Login failed");
        return;
      }
      navigate("/dashboard");
      return;
    }

    // Signup mode
    let referredBy: string | null = null;
    let partnerRef: string | null = null;
    try {
      referredBy = sessionStorage.getItem(REF_SESSION_KEY);
      partnerRef = sessionStorage.getItem(PARTNER_REF_KEY);
    } catch {}

    const { error } = await signUp(email.trim().toLowerCase(), password, {
      name: name.trim(),
      ...(referredBy ? { referred_by: referredBy } : {}),
    });

    setLoading(false);

    if (error) {
      toast.error(error.message || "Signup failed");
      return;
    }

    // Track partner conversion
    if (partnerRef) {
      (supabase.rpc as any)("process_partner_referral", { p_partner_code: partnerRef }).then(() => {});
    }

    trackEvent("signup_completed");
    toast.success("Account created!");
    navigate("/day/1");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-foreground text-center mb-2">
          {mode === "login" ? "Welcome back" : "Start building your growth system"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {mode === "login"
            ? "Sign in to continue your challenge."
            : "Join the 3-day challenge and turn your audience into a trust-powered engine."}
        </p>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
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
              )}

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

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                disabled={!isValid || loading}
                className="w-full h-12 text-base rounded-xl gap-2"
              >
                {mode === "login" ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    {loading ? "Signing in…" : "Sign in"}
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    {loading ? "Creating account…" : "Create account"}
                  </>
                )}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                {mode === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <button type="button" onClick={() => setMode("signup")} className="text-primary underline">
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button type="button" onClick={() => setMode("login")} className="text-primary underline">
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
