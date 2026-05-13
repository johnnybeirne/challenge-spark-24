import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Settings, Users, Activity, FileText, GraduationCap, Eye, MessageCircle, FileEdit, Banknote, Wrench } from "lucide-react";

const sections = [
  {
    title: "Content Editor",
    description: "Edit every headline, subhead, button, and paragraph across all pages",
    icon: FileEdit,
    to: "/owner-console/content",
    color: "text-primary",
  },
  {
    title: "Analytics",
    description: "Funnel metrics, daily events, user activity",
    icon: BarChart3,
    to: "/owner-console/analytics",
    color: "text-blue-500",
  },
  {
    title: "Content Editor",
    description: "Edit public-facing content visually (WYSIWYG)",
    icon: Settings,
    to: "/owner-console/content",
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
    title: "Payouts",
    description: "Approve commissions, batch into payouts, mark as paid",
    icon: Banknote,
    to: "/owner-console/payouts",
    color: "text-green-500",
  },
  {
    title: "Activity Feed",
    description: "Manage simulated activity feed items",
    icon: Activity,
    to: "/owner-console/activity",
    color: "text-purple-500",
  },
  {
    title: "Training System",
    description: "Review the guided training added before and inside challenge days",
    icon: GraduationCap,
    to: "/owner-console/training",
    color: "text-violet-500",
  },
  {
    title: "Diagnostic Responses",
    description: "Edit the Johnny B AI chat shown on the results page for each score tier",
    icon: MessageCircle,
    to: "/owner-console/diagnostic-responses",
    color: "text-pink-500",
  },
  {
    title: "View as User",
    description: "Open a clean demo user session and walk through the full experience",
    icon: Eye,
    to: "/owner-console/view-as-user",
    color: "text-emerald-500",
  },
  {
    title: "Client Feature Overview",
    description: "Copy-ready feature summaries with administrator workflow",
    icon: FileText,
    to: "/owner-console/features",
    color: "text-cyan-500",
  },
];

const AdminHub = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Owner Console</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Full control over the challenge — content, users, analytics, and configuration.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold mb-3">Preview challenge days (admin bypass)</h2>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((d) => (
            <Link
              key={d}
              to={`/day/${d}`}
              className="px-4 py-2 rounded-md border border-border bg-background hover:bg-primary/10 hover:border-primary text-sm font-medium transition-colors"
            >
              Day {d}
            </Link>
          ))}
        </div>
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
