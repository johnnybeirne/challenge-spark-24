import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Tag } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { setEntryIntent, setPendingCoupon, getPendingCoupon } from "@/lib/entryIntent";

const PremiumAssessment = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const couponFromUrl = params.get("coupon");

  useEffect(() => {
    setEntryIntent("premium_course");
    if (couponFromUrl) setPendingCoupon(couponFromUrl);
    trackEvent("assessment_started" as any, { entry: "premium_course", coupon: couponFromUrl ?? null });
  }, [couponFromUrl]);

  const coupon = couponFromUrl || getPendingCoupon();

  const start = () => {
    setEntryIntent("premium_course");
    if (couponFromUrl) setPendingCoupon(couponFromUrl);
    navigate("/assess");
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex min-h-[82vh] w-full max-w-4xl items-center px-5 py-8 text-center sm:px-6 lg:px-8">
        <div className="w-full">
          <p className="mb-4 inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
            Premium Course Funnel
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Find Out What Your Growth System Is Missing
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            Take the Leadio assessment before enrolling in the Growth Accelerator so your premium training starts with the right diagnosis.
          </p>

          {coupon && (
            <p className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-card px-4 py-1.5 text-sm font-bold">
              <Tag className="h-4 w-4 text-primary" /> Coupon detected: <span className="font-mono">{coupon}</span>
            </p>
          )}

          <div className="mx-auto mt-8 grid max-w-xl gap-3 text-left">
            {[
              "Diagnose what's missing in your current funnel",
              "Get a tailored next step in under 2 minutes",
              "Continue straight into Premium enrolment",
            ].map((line) => (
              <div key={line} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                <p className="font-semibold leading-7 text-foreground">{line}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Button
              className="h-16 w-full max-w-sm gap-2 rounded-xl text-base font-black uppercase shadow-lg shadow-primary/20 sm:w-auto sm:px-10"
              onClick={start}
            >
              Start Premium Assessment
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-sm text-muted-foreground">
              Takes less than 2 minutes. Your coupon (if any) is preserved through to enrolment.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default PremiumAssessment;
