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
import leadioLogo from "@/assets/leadio-logo.png";
import AuthGuard, { PartnerGuard } from "@/components/AuthGuard";
import Landing from "@/pages/Landing";
import ChallengeLanding from "@/pages/ChallengeLanding";
import Assessment from "@/pages/Assessment";
import Results from "@/pages/Results";
import ChallengeSignup from "@/pages/ChallengeSignup";
import BlueprintSignup from "@/pages/BlueprintSignup";
import ResetPassword from "@/pages/ResetPassword";
import Training from "@/pages/Training";
import Dashboard from "@/pages/Dashboard";
import DayChallenge from "@/pages/DayChallenge";
import Unlocks from "@/pages/Unlocks";
import RedeemCredits from "@/pages/RedeemCredits";
import Referrals from "@/pages/Referrals";
import Community from "@/pages/Community";
import Calendar from "@/pages/Calendar";
import Leaderboard from "@/pages/Leaderboard";
import Rewards from "@/pages/Rewards";
import PromptLibrary from "@/pages/PromptLibrary";
import ResourcesPage from "@/pages/Resources";
import Mentor from "@/pages/Mentor";
import BlueprintLanding from "@/pages/blueprint/BlueprintLanding";
import BlueprintDashboard from "@/pages/blueprint/BlueprintDashboard";
import BlueprintLesson from "@/pages/blueprint/BlueprintLesson";
import BlueprintInsight from "@/pages/blueprint/BlueprintInsight";
import BlueprintBridge from "@/pages/blueprint/BlueprintBridge";
import RewardDetail from "@/pages/RewardDetail";
import Partners from "@/pages/Partners";
import PartnerDashboard from "@/pages/PartnerDashboard";
import PartnerPerformance from "@/pages/PartnerPerformance";
import AdminAnalytics from "@/pages/AdminAnalytics";
import AdminHub from "@/pages/AdminHub";
import AdminPromoters from "@/pages/AdminPromoters";
import AdminActivityFeed from "@/pages/AdminActivityFeed";
import AdminTraining from "@/pages/AdminTraining";
import AdminViewAsUser from "@/pages/AdminViewAsUser";
import AdminDiagnosticResponses from "@/pages/AdminDiagnosticResponses";
import AdminContent from "@/pages/AdminContent";
import AdminChallengeDays from "@/pages/AdminChallengeDays";
import AdminCoupons from "@/pages/AdminCoupons";
import AdminSignups from "@/pages/AdminSignups";
import Features from "@/pages/Features";
import FeatureOverviewPage from "@/pages/FeatureOverviewPage";
import AdminLayout from "@/components/admin/AdminLayout";
import Waitlist from "@/pages/Waitlist";
import UserFeaturesAudit from "@/pages/UserFeaturesAudit";
import PartnerSales from "@/pages/PartnerSales";
import CheckoutReturn from "@/pages/CheckoutReturn";
import InviteEntry from "@/pages/InviteEntry";

import Links from "@/pages/Links";
import Premium from "@/pages/Premium";
import NotFound from "@/pages/NotFound";
import FreePreviewBadge from "@/components/FreePreviewBadge";
import QaModePanel from "@/components/QaModePanel";
import ScrollToTop from "@/components/ScrollToTop";
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
            <FreePreviewBadge />
            <QaModePanel />
            <ExperienceShell>
            <Routes>
              {/* Landing – full-width layout */}
              <Route element={<AppShell fullWidth />}>
                {/* Canonical primary entry — assessment-first landing */}
                <Route path="/" element={<Landing />} />
                {/* Direct challenge entry (high-intent users; does NOT force LMS) */}
                <Route path="/challenge" element={<ChallengeLanding />} />
                {/* Free Training (Blueprint LMS) entry */}
                <Route path="/blueprint" element={<Navigate to="/free-training" replace />} />
                <Route path="/free-training" element={<BlueprintLanding />} />
                <Route path="/premium" element={<Premium />} />
              </Route>

              {/* Public routes – narrow mobile container */}
              <Route element={<AppShell />}>
                {/* Unified assessment engine — one component, three entry routes (mode controls post-result destination) */}
                <Route path="/assess" element={<Assessment mode="challenge" />} />
                <Route path="/assessment" element={<Assessment mode="challenge" />} />
                <Route path="/free-assessment" element={<Assessment mode="free_training" />} />
                <Route path="/premium-assessment" element={<Assessment mode="premium_course" />} />
                {/* Direct enrolment aliases */}
                <Route path="/free-training/enrol" element={<RedirectKeepingQuery to="/blueprint-join" />} />
                <Route path="/premium/enrol" element={<RedirectKeepingQuery to="/premium" />} />
                <Route path="/links" element={<Links />} />
                <Route path="/results" element={<Results />} />
                <Route path="/results/low" element={<Results />} />
                <Route path="/results/med" element={<Results />} />
                <Route path="/results/high" element={<Results />} />
                <Route path="/join" element={<ChallengeSignup />} />
                <Route path="/blueprint-join" element={<BlueprintSignup />} />
                <Route path="/premium-join" element={<PremiumSignup />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/partners" element={<Partners />} />
                <Route path="/waitlist" element={<Waitlist />} />
                <Route path="/app/features" element={<FeatureOverviewPage mode="user" />} />
                {/* Partner-branded landing — canonical + legacy alias */}
                <Route path="/p/:partnerCode" element={<PartnerSales />} />
                <Route path="/partner/:partnerCode" element={<PartnerSales />} />
                {/* Referral invite entry — stores code then funnels into assessment */}
                <Route path="/invite/:referralCode" element={<InviteEntry />} />
                {/* Premium course sales pages (JV partner variant supports coupon via partner code) */}
                <Route path="/premium/:partnerCode" element={<PartnerSales />} />
                <Route path="/checkout/return" element={<CheckoutReturn />} />
              </Route>

              {/* Authenticated routes — consumer + shared */}
              <Route element={<AppShell showNav />}>
                <Route path="/let-me-in" element={<AdminViewAsUser redirectTo="/user-dashboard" />} />
                <Route path="/training" element={<AuthGuard><Training /></AuthGuard>} />
                <Route path="/user-dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
                <Route path="/day/:day" element={<AuthGuard><DayChallenge /></AuthGuard>} />
                <Route path="/unlocks" element={<AuthGuard><Unlocks /></AuthGuard>} />
                <Route path="/redeem" element={<AuthGuard><RedeemCredits /></AuthGuard>} />
                <Route path="/referrals" element={<AuthGuard><Referrals /></AuthGuard>} />
                <Route path="/community" element={<AuthGuard><Community /></AuthGuard>} />
                <Route path="/calendar" element={<AuthGuard><Calendar /></AuthGuard>} />
                <Route path="/leaderboard" element={<AuthGuard><Leaderboard /></AuthGuard>} />
                <Route path="/bonus-vault" element={<AuthGuard><Rewards /></AuthGuard>} />
                <Route path="/rewards" element={<Navigate to="/bonus-vault" replace />} />
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

              {/* Owner console — sidebar layout, password-protected */}
              <Route path="/owner-console" element={<AdminLayout />}>
                <Route index element={<AdminHub />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="cms" element={<Navigate to="/owner-console/content" replace />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="challenge-days" element={<AdminChallengeDays />} />
                <Route path="promoters" element={<AdminPromoters />} />
                <Route path="signups" element={<AdminSignups />} />
                <Route path="activity" element={<AdminActivityFeed />} />
                <Route path="training" element={<AdminTraining />} />
                <Route path="view-as-user" element={<AdminViewAsUser />} />
                <Route path="diagnostic-responses" element={<AdminDiagnosticResponses />} />
                <Route path="features" element={<FeatureOverviewPage mode="admin" />} />
                <Route path="coupons" element={<AdminCoupons />} />
              </Route>

              {/* Internal audit — admin protected via AdminLayout */}
              <Route path="/user-features" element={<AdminLayout />}>
                <Route index element={<UserFeaturesAudit />} />
              </Route>

              {/* Legacy admin redirects */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminHub />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="cms" element={<Navigate to="/owner-console/content" replace />} />
                <Route path="features" element={<FeatureOverviewPage mode="admin" />} />
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
