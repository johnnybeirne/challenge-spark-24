import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";

const schema = z.object({
  name: z.string().trim().min(1, { message: "Please add your name" }).max(80, { message: "Name is too long" }),
  email: z.string().trim().email({ message: "Please enter a valid email" }).max(255, { message: "Email is too long" }),
});

/**
 * Alternative to joining the challenge: capture name + email and send a
 * sign-in link so the person can read their report inside their own area.
 */
const ResultsReportOptIn = () => {
  const { signInWithMagicLink } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ name, email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    setSending(true);
    const { error: authError } = await signInWithMagicLink(parsed.data.email, {
      name: parsed.data.name,
      first_name: parsed.data.name.split(" ")[0],
    });
    setSending(false);
    if (authError) {
      setError(authError.message ?? "We could not send the link. Please try again.");
      return;
    }
    trackEvent("results_report_optin" as any, {});
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-7 w-7 text-primary" />
        <h3 className="text-[length:var(--h2-size)] font-semibold text-foreground">Check your email</h3>
        <p className="mt-2 text-[var(--body-size)] text-muted-foreground">
          We sent a secure link to {email}. Open it and your report will be waiting in your own area.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-start gap-3">
        <Mail className="mt-0.5 h-5 w-5 text-primary" />
        <div>
          <h3 className="text-[length:var(--h2-size)] font-semibold text-foreground">
            Not ready for the challenge? Get your report instead
          </h3>
          <p className="mt-1 text-[var(--body-size)] text-muted-foreground">
            Add your name and email and we will send you a link to read your full report in your own area.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="report-name">Your name</Label>
          <Input
            id="report-name"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Murphy"
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="report-email">Email</Label>
          <Input
            id="report-email"
            type="email"
            value={email}
            maxLength={255}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        {error && <p className="text-[var(--body-size)] text-destructive">{error}</p>}

        <Button type="submit" variant="outline" className="h-12 w-full font-semibold" disabled={sending}>
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending your link
            </>
          ) : (
            "Send me my report"
          )}
        </Button>
      </form>
    </div>
  );
};

export default ResultsReportOptIn;
