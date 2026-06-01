import { useEffect, useState } from "react";
import { Outlet, Link, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import Spinner from "@/components/Spinner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 600;

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const userId = user?.id ?? null;
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [roleCheckFailed, setRoleCheckFailed] = useState(false);
  const [redirectToJoin, setRedirectToJoin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRoleCheckFailed(false);
    setRedirectToJoin(false);
    setCheckingRole(true);

    if (!userId) {
      setIsAdmin(false);
      setCheckingRole(false);
      return;
    }

    const attempt = async (n: number): Promise<void> => {
      try {
        const { data, error } = await supabase.rpc("has_role", {
          _user_id: userId,
          _role: "admin",
        });
        if (cancelled) return;
        if (error) throw error;
        if (data) {
          setIsAdmin(true);
          setCheckingRole(false);
          return;
        }
        // No role found — not necessarily an error, but retry in case roles
        // are still hydrating right after login.
        if (n < MAX_RETRIES) {
          setTimeout(() => { if (!cancelled) attempt(n + 1); }, RETRY_BASE_DELAY * 2 ** n);
          return;
        }
        setIsAdmin(false);
        setCheckingRole(false);
      } catch (err) {
        if (cancelled) return;
        console.warn(`[AdminLayout] owner-access check attempt ${n + 1} failed`, err);
        if (n < MAX_RETRIES) {
          setTimeout(() => { if (!cancelled) attempt(n + 1); }, RETRY_BASE_DELAY * 2 ** n);
          return;
        }
        setRoleCheckFailed(true);
        setCheckingRole(false);
        setRedirectToJoin(true);
      }
    };

    attempt(0);

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading || checkingRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4 bg-background">
        <Shield className="h-10 w-10 text-primary" />
        <Spinner />
        <p className="text-sm text-muted-foreground">Checking owner access…</p>
      </div>
    );
  }

  if (redirectToJoin) {
    const currentPath = window.location.pathname;
    return <Navigate to={`/join?mode=login&redirect=${encodeURIComponent(currentPath)}`} replace />;
  }

  if (!user) {
    const currentPath = window.location.pathname;
    const loginHref = `/join?mode=login&redirect=${encodeURIComponent(currentPath)}`;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4 bg-background text-center">
        <Shield className="h-10 w-10 text-primary" />
        <h1 className="text-xl font-bold">Owner Access</h1>
        <p className="text-sm text-muted-foreground">Sign in with your admin account to continue.</p>
        <Button asChild>
          <Link to={loginHref}>Log in as admin</Link>
        </Button>
      </div>
    );
  }

  if (!isAdmin) {
    const currentPath = window.location.pathname;
    const switchHref = `/join?mode=login&redirect=${encodeURIComponent(currentPath)}`;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4 bg-background text-center">
        <Shield className="h-10 w-10 text-primary" />
        <h1 className="text-xl font-bold">Owner Access</h1>
        <p className="text-sm text-muted-foreground">
          {roleCheckFailed
            ? "We couldn't verify owner access. Redirecting to sign in…"
            : `Your signed-in account (${user.email}) does not have admin access.`}
        </p>
        <Button asChild variant="outline">
          <Link to={switchHref}>Sign in as admin</Link>
        </Button>
      </div>
    );
  }


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b bg-background/80 backdrop-blur sticky top-0 z-10">
            <SidebarTrigger className="ml-2" />
            <span className="ml-3 text-sm font-medium text-muted-foreground">Admin</span>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
