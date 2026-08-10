import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";

const RedirectKeepingQuery = ({ to }: { to: string }) => {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
};
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { SiteConfigProvider } from "@/context/SiteConfigContext";
import { AuthProvider } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import ExperienceShell from "@/components/ExperienceShell";
import AuthGuard, { PartnerGuard } from "@/components/AuthGuard";
import Landing from "@/pages/Landing";
import ChallengeLanding from "@/pages/ChallengeLanding";
import Assessment from "@/pages/Assessment";
import Results from "@/pages/Results";
import ChallengeSignup from "@/pages/ChallengeSignup";
import BlueprintSignup from "@/pages/BlueprintSignup";
import ResetPassword from "@/pages/ResetPassword";
import Day1 from "@/pages/Day1";
import Dashboard from "@/pages/Dashboard";
import DayChallenge from "@/pages/DayChallenge";
import QuizPreview from "@/pages/QuizPreview";
import Unlocks from "@/pages/Unlocks";
import RedeemPoints from "@/pages/RedeemPoints";
import EarnRewards from "@/pages/EarnRewards";
import InviteFriends from "@/pages/InviteFriends";
import Leaderboard from "@/pages/Leaderboard";
import PromptLibrary from "@/pages/PromptLibrary";
import ResourcesPage from "@/pages/Resources";
import Mentor from "@/pages/Mentor";
import Profile from "@/pages/Profile";


import BlueprintLanding from "@/pages/blueprint/BlueprintLanding";
import BlueprintDashboard from "@/pages/blueprint/BlueprintDashboard";
import BlueprintLesson from "@/pages/blueprint/BlueprintLesson";
import BlueprintInsight from "@/pages/blueprint/BlueprintInsight";
import BlueprintBridge from "@/pages/blueprint/BlueprintBridge";
import RewardDetail from "@/pages/RewardDetail";
import Rewards from "@/pages/Rewards";

import Partners from "@/pages/Partners";
import JvPartners from "@/pages/JvPartners";
import JvApply from "@/pages/JvApply";
import PartnerDashboard from "@/pages/PartnerDashboard";
import PartnerPerformance from "@/pages/PartnerPerformance";
import AdminAnalytics from "@/pages/AdminAnalytics";
import AdminHub from "@/pages/AdminHub";
import AdminPromoters from "@/pages/AdminPromoters";
import AdminActivityFeed from "@/pages/AdminActivityFeed";
import AdminTraining from "@/pages/AdminTraining";
import AdminDay1Steps from "@/pages/AdminDay1Steps";
import AdminDay2Buttons from "@/pages/AdminDay2Buttons";
import AdminQuizPreviewTips from "@/pages/AdminQuizPreviewTips";
import AdminViewAsUser, { AdminViewAsUserAutoLaunch } from "@/pages/AdminViewAsUser";
import AdminBios from "@/pages/AdminBios";
import AdminLeadGenQuizResponses from "@/pages/AdminLeadGenQuizResponses";
import AdminLeadGenQuiz from "@/pages/AdminLeadGenQuiz";
import AdminContent from "@/pages/AdminContent";

import AdminCoupons from "@/pages/AdminCoupons";
import AdminPayouts from "@/pages/AdminPayouts";
import AdminPartnerOps from "@/pages/AdminPartnerOps";
import AdminJvPartners from "@/pages/AdminJvPartners";
import AdminSignups from "@/pages/AdminSignups";
import AdminWaitlistEmail from "@/pages/AdminWaitlistEmail";
import AdminNewsletter from "@/pages/AdminNewsletter";
import AdminMilestoneEmails from "@/pages/AdminMilestoneEmails";
import Unsubscribe from "@/pages/Unsubscribe";
import FeatureOverviewPage from "@/pages/FeatureOverviewPage";
import AdminOverview from "@/pages/AdminOverview";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminResourceLibrary from "@/pages/admin/AdminResourceLibrary";
import AdminResultsAdvisorPrompts from "@/pages/admin/AdminResultsAdvisorPrompts";
import AdminTypography from "@/pages/admin/AdminTypography";
import AdminLandingPreview from "@/pages/AdminLandingPreview";
import AdminPremiumUpsell from "@/pages/AdminPremiumUpsell";
import AdminPremiumPage from "@/pages/AdminPremiumPage";
import AdminReferralSettings from "@/pages/AdminReferralSettings";
import AdminUnlockGates from "@/pages/AdminUnlockGates";
import AdminBuilderPrompts from "@/pages/AdminBuilderPrompts";
import AdminNavTips from "@/pages/AdminNavTips";
import AdminRewardsLadder from "@/pages/AdminRewardsLadder";
import AdminAccessPages from "@/pages/AdminAccessPages";
import AdminMentorPrompts from "@/pages/AdminMentorPrompts";
import AccessPageTemplate from "@/components/AccessPageTemplate";
import Waitlist from "@/pages/Waitlist";
import FeatureExtractor from "@/pages/FeatureExtractor";
import RequirementsChecklist from "@/pages/RequirementsChecklist";
import WaitlistThanks from "@/pages/WaitlistThanks";
import AboutMe from "@/pages/AboutMe";


import PartnerSales from "@/pages/PartnerSales";
import CheckoutReturn from "@/pages/CheckoutReturn";
import InviteEntry from "@/pages/InviteEntry";

import Links from "@/pages/Links";
import Premium from "@/pages/Premium";
import PoweredBy from "@/pages/PoweredBy";
import LogoAnimationPreview from "@/pages/LogoAnimationPreview";
import DebugAttribution from "@/pages/DebugAttribution";
import NotFound from "@/pages/NotFound";

import ScrollToTop from "@/components/ScrollToTop";
import AttributionCapture from "@/components/AttributionCapture";
import TypographyLoader from "@/components/TypographyLoader";
import { initFreePreviewFromUrl } from "@/lib/previewTier";

if (typeof window !== "undefined") initFreePreviewFromUrl();

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SiteConfigProvider>
      <AuthProvider>
        <AppProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <AttributionCapture />
            <TypographyLoader />
            {/* QA preview status pill is rendered by QaModePanel — no separate badge needed */}

            
            <ExperienceShell>
            <Routes>
              {/* Landing – full-width layout */}
              <Route element={<AppShell fullWidth />}>
                {/* Canonical primary entry — assessment-first landing */}
                <Route path="/" element={<Landing />} />
                {/* Challenge: canonical /challenge marketing entry */}
                <Route path="/challenge" element={<ChallengeLanding />} />
                {/* Blueprint: canonical /blueprint marketing entry */}
                <Route path="/blueprint" element={<BlueprintLanding />} />
                {/* Legacy alias kept for inbound links */}
                <Route path="/free-training" element={<RedirectKeepingQuery to="/blueprint" />} />
                {/* VIP: /premium canonical, /vip alias */}
                <Route path="/premium" element={<Premium />} />
                <Route path="/vip" element={<RedirectKeepingQuery to="/premium" />} />
                <Route path="/admin/landing-preview" element={<AdminLandingPreview />} />
              </Route>

              {/* Public routes – narrow mobile container */}
              <Route element={<AppShell />}>
                {/* Canonical assessment route */}
                <Route path="/assessment" element={<Assessment mode="challenge" />} />
                {/* Legacy alias */}
                <Route path="/assess" element={<RedirectKeepingQuery to="/assessment" />} />
                {/* Mode-specific assessment entries (different post-result destination) */}
                <Route path="/free-assessment" element={<Assessment mode="free_training" />} />
                <Route path="/premium-assessment" element={<Assessment mode="premium_course" />} />
                {/* Direct enrolment aliases */}
                <Route path="/free-training/enrol" element={<RedirectKeepingQuery to="/blueprint/join" />} />
                <Route path="/premium/enrol" element={<RedirectKeepingQuery to="/premium" />} />
                <Route path="/links" element={<Links />} />
                <Route path="/results" element={<Results />} />
                <Route path="/results/low" element={<Results />} />
                <Route path="/results/med" element={<Results />} />
                <Route path="/results/high" element={<Results />} />
                {/* Canonical signup routes */}
                <Route path="/challenge/join" element={<ChallengeSignup />} />
                <Route path="/blueprint/join" element={<BlueprintSignup />} />
                {/* Legacy signup aliases — redirect to canonical, preserve query (?redirect=, ?ref=, etc.) */}
                <Route path="/join" element={<RedirectKeepingQuery to="/challenge/join" />} />
                <Route path="/blueprint-join" element={<RedirectKeepingQuery to="/blueprint/join" />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/partners" element={<Partners />} />
                <Route path="/jv" element={<JvPartners />} />
                <Route path="/jv-partners" element={<JvPartners />} />
                <Route path="/partners-more-details" element={<JvPartners />} />

                <Route path="/jv-apply" element={<JvApply />} />
                <Route path="/waitlist" element={<Waitlist />} />
                <Route path="/waitlist/thanks" element={<WaitlistThanks />} />
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                <Route path="/app/features" element={<FeatureOverviewPage mode="user" />} />
                <Route path="/workflow" element={<Navigate to="/owner-console/overview?tab=workflow" replace />} />
                {/* Partner-branded landing */}
                <Route path="/p/:partnerCode" element={<PartnerSales />} />
                {/* Referral invite entry — stores code then funnels into assessment */}
                <Route path="/invite/:referralCode" element={<InviteEntry />} />
                {/* Premium course sales pages (JV partner variant supports coupon via partner code) */}
                <Route path="/premium/:partnerCode" element={<PartnerSales />} />
                <Route path="/checkout/return" element={<CheckoutReturn />} />
                <Route path="/debug/attribution" element={<DebugAttribution />} />
                <Route path="/about-me" element={<AboutMe />} />
                <Route path="/about" element={<Navigate to="/about-me" replace />} />
              </Route>


              {/* Authenticated routes — consumer + shared */}
              <Route element={<AppShell showNav />}>
                <Route path="/let-me-in" element={<AdminViewAsUserAutoLaunch redirectTo="/challenger-dashboard" />} />
                <Route path="/challenger-dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
                <Route path="/your-dashboard" element={<RedirectKeepingQuery to="/challenger-dashboard" />} />
                <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />

                <Route path="/user-dashboard" element={<RedirectKeepingQuery to="/challenger-dashboard" />} />
                {/* Training hub — separate from Day 1. Pre-challenge + per-day videos. */}
                <Route path="/training" element={<AuthGuard><AccessPageTemplate pageKey="training" /></AuthGuard>} />
                {/* Day 1 — canonical route. Day1Setup (assessment + AI builder). */}
                <Route path="/challenge/day-1" element={<AuthGuard><Day1 /></AuthGuard>} />
                <Route path="/challenge/day/1" element={<RedirectKeepingQuery to="/challenge/day-1" />} />
                <Route path="/day/1" element={<RedirectKeepingQuery to="/challenge/day-1" />} />
                {/* Canonical day route (slash form) — handles Day 2 & 3 */}
                <Route path="/challenge/day/:day" element={<AuthGuard><DayChallenge /></AuthGuard>} />
                {/* Hyphen-form aliases — React Router v6 needs explicit static paths (no partial dynamic segments) */}
                <Route path="/challenge/day-2" element={<RedirectKeepingQuery to="/challenge/day/2" />} />
                <Route path="/challenge/day-3" element={<RedirectKeepingQuery to="/challenge/day/3" />} />
                {/* Legacy day route — kept functional for existing links/analytics */}
                <Route path="/day/:day" element={<AuthGuard><DayChallenge /></AuthGuard>} />

                <Route path="/unlocks" element={<AuthGuard><Unlocks /></AuthGuard>} />
                <Route path="/redeem" element={<AuthGuard><RedeemPoints /></AuthGuard>} />
                <Route path="/invites" element={<AuthGuard><InviteFriends /></AuthGuard>} />
                <Route path="/earn" element={<AuthGuard><EarnRewards /></AuthGuard>} />
                {/* Legacy routes — redirect to the unified Earn Rewards page */}
                <Route path="/referrals" element={<Navigate to="/earn" replace />} />
                <Route path="/community" element={<AuthGuard><AccessPageTemplate pageKey="community" /></AuthGuard>} />
                <Route path="/calendar" element={<AuthGuard><AccessPageTemplate pageKey="events" /></AuthGuard>} />
                <Route path="/leaderboard" element={<AuthGuard><Leaderboard /></AuthGuard>} />
                <Route path="/bonus-vault" element={<Navigate to="/earn" replace />} />
                <Route path="/rewards" element={<AuthGuard><Rewards /></AuthGuard>} />
                <Route path="/reward/:id" element={<AuthGuard><RewardDetail /></AuthGuard>} />
                <Route path="/mentor" element={<AuthGuard><Mentor /></AuthGuard>} />
                <Route path="/prompt-library" element={<AuthGuard><PromptLibrary /></AuthGuard>} />
                <Route path="/resources" element={<AuthGuard><ResourcesPage /></AuthGuard>} />
                <Route path="/upgrade" element={<Navigate to="/premium" replace />} />
                <Route path="/blueprint/dashboard" element={<AuthGuard><BlueprintDashboard /></AuthGuard>} />
                <Route path="/blueprint/lesson/:day" element={<AuthGuard><BlueprintLesson /></AuthGuard>} />
                <Route path="/blueprint/insight" element={<AuthGuard><BlueprintInsight /></AuthGuard>} />
                <Route path="/blueprint/bridge" element={<AuthGuard><BlueprintBridge /></AuthGuard>} />

                {/* Partner-only routes */}
                <Route path="/promoter" element={<PartnerGuard><PartnerDashboard /></PartnerGuard>} />
                <Route path="/partner/performance" element={<PartnerGuard><PartnerPerformance /></PartnerGuard>} />
              </Route>

              {/* Quiz preview — full-screen, no app shell / sidebar / nav */}
              <Route path="/quiz-preview" element={<AuthGuard><QuizPreview /></AuthGuard>} />
              <Route path="/powered-by" element={<PoweredBy />} />
              <Route path="/logo-animation" element={<LogoAnimationPreview />} />



              {/* Owner console — sidebar layout, password-protected */}
              <Route path="/owner-console" element={<AdminLayout />}>
                <Route index element={<AdminHub />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="cms" element={<Navigate to="/owner-console/content" replace />} />
                <Route path="content" element={<AdminContent />} />
                
                <Route path="promoters" element={<AdminPromoters />} />
                <Route path="signups" element={<AdminSignups />} />
                
                <Route path="waitlist-email" element={<AdminWaitlistEmail />} />
                <Route path="newsletter" element={<AdminNewsletter />} />
                <Route path="milestone-emails" element={<AdminMilestoneEmails />} />
                <Route path="activity" element={<AdminActivityFeed />} />
                <Route path="training" element={<AdminTraining />} />
                <Route path="day1-steps" element={<AdminDay1Steps />} />
                <Route path="day2-buttons" element={<AdminDay2Buttons />} />
                <Route path="quiz-preview-tips" element={<AdminQuizPreviewTips />} />
                <Route path="view-as-user" element={<AdminViewAsUser />} />
                <Route path="test-accounts" element={<Navigate to="/owner-console/view-as-user" replace />} />
                <Route path="bios" element={<AdminBios />} />
                <Route path="diagnostic-responses" element={<AdminLeadGenQuizResponses />} />
                <Route path="lead-gen-quiz" element={<AdminLeadGenQuiz />} />
                <Route path="overview" element={<AdminOverview />} />
                <Route path="features" element={<Navigate to="/owner-console/overview?tab=features" replace />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="payouts" element={<AdminPayouts />} />
                <Route path="partner-ops" element={<AdminPartnerOps />} />
                <Route path="jv-partners" element={<AdminJvPartners />} />
                <Route path="resources" element={<AdminResourceLibrary />} />
                <Route path="results-advisor-prompts" element={<AdminResultsAdvisorPrompts />} />
                <Route path="typography" element={<AdminTypography />} />
                <Route path="premium-upsell" element={<AdminPremiumUpsell />} />
                <Route path="premium-page" element={<AdminPremiumPage />} />
                <Route path="nav-tips" element={<AdminNavTips />} />
                <Route path="rewards-ladder" element={<AdminRewardsLadder />} />
                <Route path="access-pages" element={<AdminAccessPages />} />
                <Route path="mentor-prompts" element={<AdminMentorPrompts />} />
                <Route path="ai-coach-settings" element={<AdminAiCoachSettings />} />
                <Route path="unlocks" element={<AdminUnlockGates />} />
                <Route path="builder-prompts" element={<AdminBuilderPrompts />} />
                <Route path="referral-settings" element={<AdminReferralSettings />} />

              </Route>

              {/* Feature extractor — admin only, full-bleed page */}
              <Route path="/feature-extractor" element={<AdminLayout />}>
                <Route index element={<FeatureExtractor />} />
              </Route>

              {/* Requirements checklist — admin only */}
              <Route path="/requirements-checklist" element={<AdminLayout />}>
                <Route index element={<RequirementsChecklist />} />
              </Route>

              {/* Internal audit — admin protected via AdminLayout */}
              <Route path="/user-features" element={<Navigate to="/owner-console/overview?tab=audit" replace />} />

              {/* Legacy admin redirects */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminHub />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="cms" element={<Navigate to="/owner-console/content" replace />} />
                <Route path="features" element={<Navigate to="/owner-console/overview?tab=features" replace />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            </ExperienceShell>
          </BrowserRouter>
        </TooltipProvider>
        </AppProvider>
      </AuthProvider>
    </SiteConfigProvider>
  </QueryClientProvider>
);

export default App;
