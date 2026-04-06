import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import AppShell from "@/components/AppShell";
import AuthGuard from "@/components/AuthGuard";
import Landing from "@/pages/Landing";
import Assessment from "@/pages/Assessment";
import PartnerDashboard from "@/pages/PartnerDashboard";
import PartnerPerformance from "@/pages/PartnerPerformance";
import Results from "@/pages/Results";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import DayChallenge from "@/pages/DayChallenge";
import Unlocks from "@/pages/Unlocks";
import Referrals from "@/pages/Referrals";
import Community from "@/pages/Community";
import Calendar from "@/pages/Calendar";
import Features from "@/pages/Features";
import Leaderboard from "@/pages/Leaderboard";
import AdminAnalytics from "@/pages/AdminAnalytics";
import AdminPromoters from "@/pages/AdminPromoters";
import AdminActivityFeed from "@/pages/AdminActivityFeed";
import InviteBuilders from "@/pages/InviteBuilders";
import Partners from "@/pages/Partners";
import Rewards from "@/pages/Rewards";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
              <Route path="/features" element={<Features />} />
              <Route path="/partners" element={<Partners />} />
            </Route>

            {/* Auth routes */}
            <Route element={<AppShell showNav />}>
              <Route path="/invite-builders" element={<AuthGuard><InviteBuilders /></AuthGuard>} />
              <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
              <Route path="/day/:day" element={<AuthGuard><DayChallenge /></AuthGuard>} />
              <Route path="/unlocks" element={<AuthGuard><Unlocks /></AuthGuard>} />
              <Route path="/referrals" element={<AuthGuard><Referrals /></AuthGuard>} />
              <Route path="/community" element={<AuthGuard><Community /></AuthGuard>} />
              <Route path="/calendar" element={<AuthGuard><Calendar /></AuthGuard>} />
              <Route path="/partner" element={<AuthGuard><PartnerDashboard /></AuthGuard>} />
              <Route path="/leaderboard" element={<AuthGuard><Leaderboard /></AuthGuard>} />
              <Route path="/rewards" element={<AuthGuard><Rewards /></AuthGuard>} />
            </Route>

            {/* Admin */}
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/promoters" element={<AdminPromoters />} />
            <Route path="/admin/activity-feed" element={<AdminActivityFeed />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
