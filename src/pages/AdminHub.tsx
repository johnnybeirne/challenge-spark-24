import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Settings, Users, Activity, Sparkles, FileText } from "lucide-react";

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
  {
    title: "Features Built",
    description: "Browse everything that has been shipped so far",
    icon: Sparkles,
    to: "/owner-console/features",
    color: "text-pink-500",
  },
  {
    title: "Client Feature Overview",
    description: "Copy-ready administrator and user feature summaries",
    icon: FileText,
    to: "/admin/features",
    color: "text-cyan-500",
  },
];

const AdminHub = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto">
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
