import { useState, useEffect, useRef, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, LogIn } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { defaultMemory, mergeMemory } from "@/lib/personalisation";
import aiAvatar from "@/assets/ai-avatar.png";

const REF_SESSION_KEY = "challengeos_ref";
const PARTNER_REF_KEY = "challengeos_partner_ref";

export type SignupProduct = "challenge" | "blueprint" | "premium";
type Mode = "signup" | "login";
type SignupStep = "name" | "email" | "password";

export interface SignupChatProps {
  product: SignupProduct;
  headline: string;
  subcopy: string;
  johnnyPrompts: { name: string; email: string; password: string };
  successHeadline: (firstName: string) => string;
  successSubcopy: string;
  defaultRedirect: string;
  /** Render extra success-screen actions. `redirect` is the resolved post-auth target. */
  renderSuccessActions?: (args: {
    firstName: string;
    redirect: string;
    goToRedirect: () => void;
  }) => ReactNode;
}

const useTypewriter = (text: string, enabled: boolean, speed = 22) => {
  const [shown, setShown] = useState(enabled ? "" : text);
  const [done, setDone] = useState(!enabled);
  useEffect(() => {
    if (!enabled) {
      setShown(text);
      setDone(true);
      return;
    }
    setShown("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, enabled, speed]);
  return { shown, done };
};

const TypingBubble = ({ text }: { text: string }) => {
  const { shown } = useTypewriter(text, true, 18);
  return (
    <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-5 py-3 text-base text-foreground max-w-[85%]">
      {shown}
      <span className="inline-block w-2 h-5 bg-foreground/40 ml-1 animate-pulse align-middle" />
    </div>
  );
};

const JohnnySuccessMessage = ({ headline, subcopy }: { headline: string; subcopy: string }) => {
  const headlineTyper = useTypewriter(headline, true, 28);
  const subcopyTyper = useTypewriter(subcopy, headlineTyper.done, 18);
  return (
    <div className="flex items-start gap-5 sm:gap-6 text-left mb-8">
      <div className="relative shrink-0">
        <img
          src={aiAvatar}
          alt="Johnny B AI"
          width={88}
          height={88}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full ring-2 ring-foreground/10"
        />
        <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-background" />
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Johnny B AI
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight text-foreground">
          {headlineTyper.shown}
          {!headlineTyper.done && (
            <span className="inline-block w-[3px] h-6 sm:h-8 bg-foreground/50 ml-1 animate-pulse align-middle" />
          )}
        </h1>
        {headlineTyper.done && (
          <p className="mt-3 text-base sm:text-lg text-muted-foreground">
            {subcopyTyper.shown}
            {!subcopyTyper.done && (
              <span className="inline-block w-[2px] h-4 bg-foreground/40 ml-1 animate-pulse align-middle" />
            )}
          </p>
        )}
      </div>
    </div>
  );
};


const SignupChat = ({
  product,
  headline,
  subcopy,
  johnnyPrompts,
  successHeadline,
  successSubcopy,
  defaultRedirect,
  renderSuccessActions,
}: SignupChatProps) => {
  const { signUp, signIn, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initialMode: Mode =
    new URLSearchParams(location.search).get("mode") === "login" ||
    (location.state as { mode?: Mode } | null)?.mode === "login"
      ? "login"
      : "signup";

  const [mode, setMode] = useState<Mode>(initialMode);

  const redirectAfterAuth = (() => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get("redirect");
    if (redirect && redirect.startsWith("/")) return redirect;
    return defaultRedirect;
  })();

  const [step, setStep] = useState<SignupStep>("name");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const name = `${firstName.trim()} ${lastName.trim()}`.trim();
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const signupInputRef = useRef<HTMLInputElement>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [emailAction, setEmailAction] = useState<"reset" | null>(null);
  const [accountExistsNotice, setAccountExistsNotice] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (mode === "signup") {
      const t = setTimeout(() => signupInputRef.current?.focus(), 600);
      return () => clearTimeout(t);
    }
  }, [step, mode]);

  const promptText = (() => {
    const raw = johnnyPrompts[step];
    return raw.replace("{name}", firstName.trim() || "there");
  })();

  const canAdvanceSignup = (() => {
    if (step === "name") return firstName.trim().length > 0 && lastName.trim().length > 0;
    if (step === "email") return signupEmail.trim().includes("@");
    return signupPassword.length >= 6;
  })();

  const handleSignupNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdvanceSignup || loading) return;
    if (step === "name") return setStep("email");
    if (step === "email") return setStep("password");

    try {
      const existing = JSON.parse(localStorage.getItem("challengeos_memory") || JSON.stringify(defaultMemory));
      localStorage.setItem("challengeos_memory", JSON.stringify(mergeMemory({ ...defaultMemory, ...existing }, { name })));
    } catch {}

    setLoading(true);
    let referredBy: string | null = null;
    let partnerRef: string | null = null;
    try {
      referredBy = sessionStorage.getItem(REF_SESSION_KEY);
      partnerRef = sessionStorage.getItem(PARTNER_REF_KEY);
    } catch {}
    let entryIntent: string | null = null;
    try { entryIntent = sessionStorage.getItem("leadio_entry_intent"); } catch {}
    const { error } = await signUp(signupEmail.trim().toLowerCase(), signupPassword, {
      name: name.trim(),
      signup_product: product,
      ...(entryIntent ? { entry_intent: entryIntent } : {}),
      ...(referredBy ? { referred_by: referredBy } : {}),
    });
    setLoading(false);
    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        setLoginEmail(signupEmail.trim().toLowerCase());
        setAccountExistsNotice(true);
        setMode("login");
        return;
      }
      return toast.error(error.message || "Signup failed");
    }
    if (partnerRef) {
      (supabase.rpc as any)("process_partner_referral", { p_partner_code: partnerRef }).then(() => {});
    }
    trackEvent("signup_completed", { product });
    toast.success("You're in.");
    setSignupComplete(true);
  };

  const signupInputProps = (() => {
    if (step === "email")
      return { type: "email", placeholder: "you@example.com", value: signupEmail, onChange: (e: any) => setSignupEmail(e.target.value), autoComplete: "email", maxLength: 255 };
    return { type: "password", placeholder: "••••••", value: signupPassword, onChange: (e: any) => setSignupPassword(e.target.value), autoComplete: "new-password", minLength: 6 };
  })();

  const canSubmitLogin = loginEmail.trim().includes("@") && loginPassword.length >= 6;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitLogin || loading) return;
    try {
      if (redirectAfterAuth === "/admin" || redirectAfterAuth.startsWith("/admin/") || redirectAfterAuth === "/owner-console" || redirectAfterAuth.startsWith("/owner-console/")) {
        sessionStorage.setItem("leadio_admin_login_pending", "1");
      }
    } catch {}
    setLoading(true);
    const { error } = await signIn(loginEmail.trim().toLowerCase(), loginPassword);
    setLoading(false);
    if (error) {
      try { sessionStorage.removeItem("leadio_admin_login_pending"); } catch {}
      return toast.error(error.message || "Login failed");
    }
    navigate(redirectAfterAuth);
  };

  const handlePasswordReset = async () => {
    if (!loginEmail.trim().includes("@") || loading || emailAction) {
      return toast.error("Enter your email first, then request the reset link.");
    }
    setEmailAction("reset");
    const { error } = await resetPassword(loginEmail.trim().toLowerCase());
    setEmailAction(null);
    if (error) return toast.error(error.message || "Could not send reset email");
    setResetSent(true);
    toast.success("Password reset instructions sent.");
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    if (next === "signup") {
      setStep("name");
      setAccountExistsNotice(false);
    }
  };

  const goToRedirect = () => navigate(redirectAfterAuth);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background relative">
      {mode === "signup" && (
        <button
          type="button"
          onClick={() => switchMode("login")}
          className="absolute top-4 right-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-foreground text-sm font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Login
        </button>
      )}
      <div className="w-full max-w-2xl">
        {signupComplete ? (
          <div>
            <JohnnySuccessMessage headline={successHeadline(firstName)} subcopy={successSubcopy} />
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              {renderSuccessActions ? (
                renderSuccessActions({ firstName, redirect: redirectAfterAuth, goToRedirect })
              ) : (
                <Button className="h-12" onClick={goToRedirect}>Continue</Button>
              )}
            </div>
          </div>

        ) : mode === "signup" ? (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-3">{headline}</h1>
            <p className="text-base text-muted-foreground text-center mb-2 max-w-xl mx-auto">{subcopy}</p>
            <p className="text-base text-muted-foreground text-center mb-12">
              Step {step === "name" ? 1 : step === "email" ? 2 : 3} of 3
            </p>

            <div className="flex items-start gap-6 mb-8">
              <div className="relative shrink-0">
                <img
                  src={aiAvatar}
                  alt="Johnny B AI"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full border-4 border-foreground/10"
                />
                <span className="absolute bottom-1 right-1 w-6 h-6 bg-primary rounded-full border-4 border-background" />
              </div>
              <div className="flex-1 pt-2">
                <div className="text-base text-muted-foreground mb-3">Johnny B AI</div>
                <TypingBubble key={step} text={promptText} />
              </div>
            </div>

            {step !== "name" && name && (
              <div className="flex justify-end mb-6">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-5 py-2.5 text-base">{name}</div>
              </div>
            )}
            {step === "password" && signupEmail && (
              <div className="flex justify-end mb-6">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-5 py-2.5 text-base">{signupEmail}</div>
              </div>
            )}

            <form onSubmit={handleSignupNext} className="flex gap-3 items-center mt-8">
              {step === "name" ? (
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <Input
                    ref={signupInputRef}
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    maxLength={50}
                    className="h-12 rounded-xl text-base px-4 border-2 border-foreground"
                  />
                  <Input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    maxLength={50}
                    className="h-12 rounded-xl text-base px-4 border-2 border-foreground"
                  />
                </div>
              ) : (
                <Input
                  key={step}
                  ref={signupInputRef}
                  {...(signupInputProps as any)}
                  className="h-12 rounded-xl text-base px-4 border-2 border-foreground flex-1"
                />
              )}
              <Button
                type="submit"
                disabled={!canAdvanceSignup || loading}
                className="h-12 w-12 rounded-xl shrink-0 p-0 border-2 border-foreground"
                aria-label="Continue"
              >
                <ArrowRight className="!w-5 !h-5" />
              </Button>
            </form>

            <div className="mt-16 pt-12 border-t border-border text-center">
              <p className="text-base text-muted-foreground mb-4">Already have an account?</p>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="inline-flex items-center gap-3 text-base font-semibold text-primary hover:underline"
              >
                <LogIn className="w-5 h-5" />
                Sign in instead
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground text-center mb-2">Welcome back</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">Sign in to continue.</p>

            {accountExistsNotice && (
              <div className="flex items-start gap-3 mb-6 p-4 rounded-xl border-2 border-foreground bg-primary/5">
                <img src={aiAvatar} alt="" className="w-10 h-10 rounded-full border-2 border-foreground/10 shrink-0" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-0.5">Johnny B AI</div>
                  <p className="text-sm text-foreground">
                    Looks like you've already got an account with that email. Pop your password in below and you're back in.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="email"
                  maxLength={255}
                  className="h-12 rounded-xl border-2 border-foreground"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="login-password">Password</Label>
                  <button type="button" onClick={handlePasswordReset} disabled={!!emailAction || loading} className="text-sm font-medium text-primary hover:underline disabled:opacity-50">
                    {emailAction === "reset" ? "Sending reset…" : "Forgot password?"}
                  </button>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                  minLength={6}
                  className="h-12 rounded-xl border-2 border-foreground"
                />
              </div>

              {resetSent && (
                <p className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-muted-foreground">
                  Check your email for reset instructions. The link opens a secure page where you can choose a new password.
                </p>
              )}

              <Button type="submit" disabled={!canSubmitLogin || loading} className="w-full h-12 rounded-xl text-base gap-2 border-2 border-foreground">
                <LogIn className="w-4 h-4" />
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button type="button" onClick={() => switchMode("signup")} className="text-sm text-muted-foreground hover:text-foreground">
                ← Back to create account
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SignupChat;
