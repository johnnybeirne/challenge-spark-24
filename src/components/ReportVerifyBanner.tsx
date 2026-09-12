import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSiteContent } from "@/hooks/useSiteContent";
import { clearReportPreview, type ReportPreview } from "@/lib/reportPreview";

/**
 * Persistent bar shown while a report preview is unverified. Entering the
 * 6-digit code from the email turns the client-side preview into a real
 * authenticated session.
 */
const ReportVerifyBanner = ({ preview }: { preview: ReportPreview }) => {
  const { verifyEmailCode } = useAuth();
  const { t } = useSiteContent("results");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError(t("report_optin.code_error", "Enter the 6-digit code from your email."));
      return;
    }
    setVerifying(true);
    const { error: verifyError } = await verifyEmailCode(preview.email, code);
    setVerifying(false);
    if (verifyError) {
      setError(verifyError.message ?? t("report_optin.code_error", "That code did not work. Please check and try again."));
      return;
    }
    clearReportPreview();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur">
      <form
        onSubmit={submit}
        className="mx-auto flex max-w-2xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
        noValidate
      >
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-[var(--body-size)] text-muted-foreground">
            {t(
              "report_optin.banner_text",
              "Enter the 6-digit code we emailed to {email} to keep access to your report.",
            ).replace("{email}", preview.email)}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex items-center gap-2">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(v) => {
                setCode(v);
                if (error) setError(null);
              }}
              aria-label={t("report_optin.code_label", "6-digit code")}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <Button type="submit" disabled={verifying} className="font-semibold">
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : t("report_optin.verify_label", "Confirm")}
            </Button>
          </div>
          {error && <p className="text-[var(--body-size)] text-destructive">{error}</p>}
        </div>
      </form>
    </div>
  );
};

export default ReportVerifyBanner;
