import { Navigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/Spinner";
import { DEMO_USER_KEY } from "@/pages/AdminViewAsUser";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { state, hydrated } = useAppState();
  const { user, loading } = useAuth();
  const isDemoUser = !!state.user && sessionStorage.getItem(DEMO_USER_KEY) === "1";

  if (isDemoUser) return <>{children}</>;
  if (loading || (user && !hydrated)) return <Spinner />;

  if (!user) {
    if (state.assessment) return <Navigate to="/results" replace />;
    return <Navigate to="/challenge/join" replace />;
  }

  return <>{children}</>;
};

/** Guard for promoter-only routes */
export const PartnerGuard = ({ children }: { children: React.ReactNode }) => {
  const { state, hydrated } = useAppState();
  const { user, loading } = useAuth();
  const isDemoUser = !!state.user && sessionStorage.getItem(DEMO_USER_KEY) === "1";

  if (isDemoUser) return <>{children}</>;
  if (loading || (user && !hydrated)) return <Spinner />;
  if (!user) return <Navigate to="/challenge/join" replace />;

  const role = state.user?.role;
  if (role !== "promoter" && role !== "admin") {
    return <Navigate to="/challenger-dashboard" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
