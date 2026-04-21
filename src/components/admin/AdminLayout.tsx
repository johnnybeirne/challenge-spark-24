import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

const ADMIN_PASSWORD = "challengeos2024";
const AUTH_KEY = "leadio_admin_authed";

const AdminLayout = () => {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(AUTH_KEY) === "1") setAuthed(true);
  }, []);

  const login = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "1");
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4 bg-background">
        <Shield className="h-10 w-10 text-primary" />
        <h1 className="text-xl font-bold">Owner Access</h1>
        <p className="text-sm text-muted-foreground">Enter your admin password to continue</p>
        <div className="flex gap-2 w-full max-w-xs">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === "Enter" && login()}
            autoFocus
          />
          <Button onClick={login}>Enter</Button>
        </div>
        {error && <p className="text-xs text-destructive">Incorrect password</p>}
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
