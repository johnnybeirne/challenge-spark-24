import { Navigate, useLocation } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/Spinner";
import { DEMO_USER_KEY } from "@/pages/AdminViewAsUser";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAppState();
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;

  const isDemo = !user && state.user && sessionStorage.getItem(DEMO_USER_KEY) === "1";

  if (!user && !isDemo) {
    if (state.assessment) return <Navigate to="/results" replace />;
    return <Navigate to="/join" replace />;
  }

  // Route returning users to training hub until they complete it
  if (!state.training?.hubCompleted && location.pathname !== "/training") {
    return <Navigate to="/training" replace />;
  }

  return <>{children}</>;
};

/** Guard for promoter-only routes */
export const PartnerGuard = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAppState();
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user && state.user && sessionStorage.getItem(DEMO_USER_KEY) === "1") return <>{children}</>;
  if (!user) return <Navigate to="/join" replace />;

  const role = state.user?.role;
  if (role !== "promoter" && role !== "admin") {
    return <Navigate to="/user-dashboard" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
