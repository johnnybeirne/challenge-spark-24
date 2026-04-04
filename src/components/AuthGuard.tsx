import { Navigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAppState();

  if (!state.user) {
    if (state.assessment) return <Navigate to="/results" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
