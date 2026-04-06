import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { SiteConfigProvider } from "@/context/SiteConfigContext";
import AppShell from "@/components/AppShell";
import AuthGuard, { PartnerGuard } from "@/components/AuthGuard";
import Landing from "@/pages/Landing";
import Assessment from "@/pages/Assessment";
import Results from "@/pages/Results";
import Signup from "@/pages/Signup";
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
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SiteConfigProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route element={<AppShell />}>
                <Route path="/" element={<Landing />} />
                <Route path="/assess" element={<Assessment />} />
                <Route path="/results" element={<Results />} />
                <Route path="/join" element={<Signup />} />
                <Route path="/partners" element={<Partners />} />
              </Route>

              {/* Authenticated routes — consumer + shared */}
              <Route element={<AppShell showNav />}>
                <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
                <Route path="/day/:day" element={<AuthGuard><DayChallenge /></AuthGuard>} />
                <Route path="/unlocks" element={<AuthGuard><Unlocks /></AuthGuard>} />
                <Route path="/referrals" element={<AuthGuard><Referrals /></AuthGuard>} />
                <Route path="/community" element={<AuthGuard><Community /></AuthGuard>} />
                <Route path="/calendar" element={<AuthGuard><Calendar /></AuthGuard>} />
                <Route path="/leaderboard" element={<AuthGuard><Leaderboard /></AuthGuard>} />

                {/* Partner-only routes */}
                <Route path="/promoter" element={<PartnerGuard><PartnerDashboard /></PartnerGuard>} />
                <Route path="/partner/performance" element={<PartnerGuard><PartnerPerformance /></PartnerGuard>} />
                <Route path="/rewards" element={<PartnerGuard><Rewards /></PartnerGuard>} />
                <Route path="/reward/:id" element={<PartnerGuard><RewardDetail /></PartnerGuard>} />
              </Route>

              {/* Admin — URL-only access */}
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/cms" element={<AdminCms />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </SiteConfigProvider>
  </QueryClientProvider>
);

export default App;
