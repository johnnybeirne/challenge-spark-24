import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { SiteConfigProvider } from "@/context/SiteConfigContext";
import { AuthProvider } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import leadioLogo from "@/assets/leadio-logo.png";
import AuthGuard, { PartnerGuard } from "@/components/AuthGuard";
import Landing from "@/pages/Landing";
import ChallengeLanding from "@/pages/ChallengeLanding";
import Assessment from "@/pages/Assessment";
import Results from "@/pages/Results";
import Signup from "@/pages/Signup";
import ResetPassword from "@/pages/ResetPassword";
import Training from "@/pages/Training";
import Dashboard from "@/pages/Dashboard";
import DayChallenge from "@/pages/DayChallenge";
import Unlocks from "@/pages/Unlocks";
import Referrals from "@/pages/Referrals";
import Community from "@/pages/Community";
import Calendar from "@/pages/Calendar";
import Leaderboard from "@/pages/Leaderboard";
import Rewards from "@/pages/Rewards";
import RewardDetail from "@/pages/RewardDetail";
import Partners from "@/pages/Partners";
import PartnerDashboard from "@/pages/PartnerDashboard";
import PartnerPerformance from "@/pages/PartnerPerformance";
import AdminAnalytics from "@/pages/AdminAnalytics";
import AdminCms from "@/pages/AdminCms";
import AdminHub from "@/pages/AdminHub";
import AdminPromoters from "@/pages/AdminPromoters";
import AdminActivityFeed from "@/pages/AdminActivityFeed";
import AdminTraining from "@/pages/AdminTraining";
import AdminViewAsUser from "@/pages/AdminViewAsUser";
import Features from "@/pages/Features";
import FeatureOverviewPage from "@/pages/FeatureOverviewPage";
import AdminLayout from "@/components/admin/AdminLayout";
import NotFound from "@/pages/NotFound";

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
            <Routes>
              {/* Landing – full-width layout */}
              <Route element={<AppShell fullWidth />}>
                <Route path="/" element={<Landing />} />
                <Route path="/challenge" element={<ChallengeLanding />} />
              </Route>

              {/* Public routes – narrow mobile container */}
              <Route element={<AppShell />}>
                <Route path="/assess" element={<Assessment />} />
                <Route path="/results" element={<Results />} />
                <Route path="/join" element={<Signup />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/partners" element={<Partners />} />
                <Route path="/app/features" element={<FeatureOverviewPage mode="user" />} />
              </Route>

              {/* Authenticated routes — consumer + shared */}
              <Route element={<AppShell showNav />}>
                <Route path="/let-me-in" element={<AdminViewAsUser redirectTo="/user-dashboard" />} />
                <Route path="/training" element={<AuthGuard><Training /></AuthGuard>} />
                <Route path="/user-dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
                <Route path="/day/:day" element={<AuthGuard><DayChallenge /></AuthGuard>} />
                <Route path="/unlocks" element={<AuthGuard><Unlocks /></AuthGuard>} />
                <Route path="/referrals" element={<AuthGuard><Referrals /></AuthGuard>} />
                <Route path="/community" element={<AuthGuard><Community /></AuthGuard>} />
                <Route path="/calendar" element={<AuthGuard><Calendar /></AuthGuard>} />
                <Route path="/leaderboard" element={<AuthGuard><Leaderboard /></AuthGuard>} />
                <Route path="/rewards" element={<AuthGuard><Rewards /></AuthGuard>} />
                <Route path="/reward/:id" element={<AuthGuard><RewardDetail /></AuthGuard>} />

                {/* Partner-only routes */}
                <Route path="/promoter" element={<PartnerGuard><PartnerDashboard /></PartnerGuard>} />
                <Route path="/partner/performance" element={<PartnerGuard><PartnerPerformance /></PartnerGuard>} />
              </Route>

              {/* Owner console — sidebar layout, password-protected */}
              <Route path="/owner-console" element={<AdminLayout />}>
                <Route index element={<AdminHub />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="cms" element={<AdminCms />} />
                <Route path="promoters" element={<AdminPromoters />} />
                <Route path="activity" element={<AdminActivityFeed />} />
                <Route path="training" element={<AdminTraining />} />
                <Route path="view-as-user" element={<AdminViewAsUser />} />
                <Route path="features" element={<FeatureOverviewPage mode="admin" />} />
              </Route>

              {/* Legacy admin redirects */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminHub />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="cms" element={<AdminCms />} />
                <Route path="features" element={<FeatureOverviewPage mode="admin" />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </AppProvider>
      </AuthProvider>
    </SiteConfigProvider>
  </QueryClientProvider>
);

export default App;
