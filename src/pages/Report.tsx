import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import ReportContent from "@/components/ReportContent";
import ReportVerifyBanner from "@/components/ReportVerifyBanner";
import { useAppState } from "@/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useReportPreview } from "@/lib/reportPreview";
import { formatFirstNameSurnameInitial, getInitials } from "@/lib/formatName";
import type { AssessmentResult } from "@/lib/assessmentData";

/**
 * Device-local report page for people who asked for their report by email.
 * Standalone wrapper: no participant navigation or participant chrome.
 */
const Report = () => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const { user: authedUser } = useAuth();
  const { t: tContent } = useSiteContent("results");
  const reportPreview = useReportPreview();

  const showPreviewIdentity = !!reportPreview && !authedUser;
  const assessment = state.assessment as unknown as AssessmentResult | null;
  const hasResult = !!assessment && "challengeType" in (assessment as object);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!hasResult) {
    return (
      <>
        <SEO title="Your Report" description="Your personalised lead generation report." canonical="/report" />
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-[var(--h1-size)] font-semibold text-foreground">
            {tContent("report_page.empty_title", "No quiz result found")}
          </h1>
          <p className="max-w-md text-[var(--body-size)] text-muted-foreground">
            {tContent(
              "report_page.empty_body",
              "Take the quiz first and your personalised report will appear here.",
            )}
          </p>
          <Button onClick={() => navigate("/assessment")} className="font-semibold">
            {tContent("report_page.empty_cta", "Take the quiz")}
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Your Report" description="Your personalised lead generation report." canonical="/report" />
      {showPreviewIdentity && (
        <div className="fixed right-4 top-4 z-40 flex items-center gap-2 rounded-full border border-border bg-card/90 py-1.5 pl-1.5 pr-4 shadow-sm backdrop-blur">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {getInitials(reportPreview!.name)}
          </span>
          <span className="text-[var(--body-size)] font-medium text-foreground">
            {formatFirstNameSurnameInitial(reportPreview!.name) || reportPreview!.name}
          </span>
        </div>
      )}

      <div
        className={`mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-6 pt-24 sm:px-6 md:w-[80%] md:pt-12 lg:w-full lg:max-w-[1080px] lg:px-8 ${
          showPreviewIdentity ? "pb-[190px]" : "pb-[74px]"
        }`}
      >
        <ReportContent
          name={reportPreview?.name ?? state.user?.name ?? ""}
          assessment={assessment}
        />
      </div>

      {showPreviewIdentity && <ReportVerifyBanner preview={reportPreview!} />}
    </>
  );
};

export default Report;
