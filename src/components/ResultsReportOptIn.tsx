import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";
import { useSiteContent } from "@/hooks/useSiteContent";

const schema = z.object({
  name: z.string().trim().min(1, { message: "Please add your name" }).max(80, { message: "Name is too long" }),
  email: z.string().trim().email({ message: "Please enter a valid email" }).max(255, { message: "Email is too long" }),
});

/**
 * Alternative to joining the challenge: capture name + email and send a
 * sign-in link so the person can read their report inside their own area.
 */
const ResultsReportOptIn = () => {
  const { sendEmailCode } = useAuth();
  const { t } = useSiteContent("results");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNameError(null);
    setEmailError(null);
    const parsed = schema.safeParse({ name, email });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "name") setNameError((prev) => prev ?? issue.message);
        if (issue.path[0] === "email") setEmailError((prev) => prev ?? issue.message);
      }
      return;
    }
    setSending(true);
    // Same Supabase auth system as the challenge join flow (one auth.users
    // account, one profiles row). The report_only markers tell the signup
    // trigger to skip the challenge progress row, so no clock starts and no
    // day is unlocked until the person actually joins the challenge.
    const { error: authError } = await signInWithMagicLink(parsed.data.email, {
      name: parsed.data.name,
      first_name: parsed.data.name.split(" ")[0],
      signup_product: "report",
      entry_intent: "report",
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
        <h3 className="text-[length:var(--h2-size)] font-semibold text-foreground">{t("report_optin.success_title", "Check your email")}</h3>
        <p className="mt-2 text-[var(--body-size)] text-muted-foreground">
          {t("report_optin.success_body", "We sent a secure link to {email}. Open it and your report will be waiting in your own area.").replace("{email}", email)}
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
            {t("report_optin.title", "Not ready for the challenge? Get your report instead")}
          </h3>
          <p className="mt-1 text-[var(--body-size)] text-muted-foreground">
            {t("report_optin.body", "Add your name and email and we will send you a link to read your full report in your own area.")}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="report-name">{t("report_optin.name_label", "Your name")}</Label>
          <Input
            id="report-name"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("report_optin.name_placeholder", "Jane Murphy")}
            autoComplete="name"
            aria-invalid={!!nameError}
            aria-describedby={nameError ? "report-name-error" : undefined}
          />
          {nameError && (
            <p id="report-name-error" className="text-[var(--body-size)] text-destructive">{nameError}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="report-email">{t("report_optin.email_label", "Email")}</Label>
          <Input
            id="report-email"
            type="email"
            value={email}
            maxLength={255}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("report_optin.email_placeholder", "you@example.com")}
            autoComplete="email"
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "report-email-error" : undefined}
          />
          {emailError && (
            <p id="report-email-error" className="text-[var(--body-size)] text-destructive">{emailError}</p>
          )}
        </div>


        {error && <p className="text-[var(--body-size)] text-destructive">{error}</p>}

        <Button type="submit" variant="outline" className="h-12 w-full font-semibold" disabled={sending}>
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> {t("report_optin.sending_label", "Sending your link")}
            </>
          ) : (
            t("report_optin.button_label", "Send me my report")
          )}
        </Button>
      </form>
    </div>
  );
};

export default ResultsReportOptIn;
