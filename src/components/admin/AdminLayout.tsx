import { useEffect, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import Spinner from "@/components/Spinner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setCheckingRole(false);
        return;
      }

      setCheckingRole(true);
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (!cancelled) {
        setIsAdmin(Boolean(data) && !error);
        setCheckingRole(false);
      }
    };

    checkAdminRole();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading || checkingRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4 bg-background">
        <Shield className="h-10 w-10 text-primary" />
        <Spinner />
        <p className="text-sm text-muted-foreground">Checking owner access…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4 bg-background text-center">
        <Shield className="h-10 w-10 text-primary" />
        <h1 className="text-xl font-bold">Owner Access</h1>
        <p className="text-sm text-muted-foreground">Sign in with your app account to continue.</p>
        <Button asChild>
          <Link to="/join">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4 bg-background text-center">
        <Shield className="h-10 w-10 text-primary" />
        <h1 className="text-xl font-bold">Owner Access</h1>
        <p className="text-sm text-muted-foreground">Your signed-in account does not have admin access.</p>
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
