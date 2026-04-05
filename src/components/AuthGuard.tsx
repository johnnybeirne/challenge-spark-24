import { Navigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/Spinner";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAppState();
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  // Require Supabase auth
  if (!user) {
    if (state.assessment) return <Navigate to="/results" replace />;
    return <Navigate to="/join" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
