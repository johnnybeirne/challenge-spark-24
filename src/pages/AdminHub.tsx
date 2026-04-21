import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, BarChart3, Settings, Users, Activity, Shield } from "lucide-react";

const ADMIN_PASSWORD = "challengeos2024";

const AdminHub = () => {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);

  const login = () => {
    if (password === ADMIN_PASSWORD) setAuthed(true);
  };

  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4">
        <Shield className="h-10 w-10 text-primary" />
        <h1 className="text-xl font-bold">Owner Access</h1>
        <p className="text-sm text-muted-foreground">Enter your admin password to continue</p>
        <div className="flex gap-2 w-full max-w-xs">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
          />
          <Button onClick={login}>Enter</Button>
        </div>
      </div>
    );
  }

  const sections = [
    {
      title: "Analytics",
      description: "Funnel metrics, daily events, user activity",
      icon: BarChart3,
      to: "/owner-console/analytics",
      color: "text-blue-500",
    },
    {
      title: "CMS",
      description: "Edit all public-facing content and configuration",
      icon: Settings,
      to: "/owner-console/cms",
      color: "text-emerald-500",
    },
    {
      title: "Promoters",
      description: "Manage promoter applications and approvals",
      icon: Users,
      to: "/owner-console/promoters",
      color: "text-amber-500",
    },
    {
      title: "Activity Feed",
      description: "Manage simulated activity feed items",
      icon: Activity,
      to: "/owner-console/activity",
      color: "text-purple-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Owner Console</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Full control over Leadio — content, users, analytics, and configuration.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Link key={s.to} to={s.to}>
            <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{s.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminHub;
