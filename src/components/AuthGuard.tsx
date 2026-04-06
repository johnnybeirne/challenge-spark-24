import { Navigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/Spinner";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAppState();
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  if (!user) {
    if (state.assessment) return <Navigate to="/results" replace />;
    return <Navigate to="/join" replace />;
  }

  return <>{children}</>;
};

/** Guard for promoter-only routes */
export const PartnerGuard = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAppState();
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/join" replace />;

  const role = state.user?.role;
  if (role !== "promoter" && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
