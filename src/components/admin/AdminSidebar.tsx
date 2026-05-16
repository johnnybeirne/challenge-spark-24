import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, BarChart3, Settings, Users, Activity, Shield, FileText, GraduationCap, Eye, MessageCircle, FileEdit, Home, ListChecks, ClipboardList, Tag, UserPlus, LogOut, Mail, Handshake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "User Journey Audit", url: "/user-features", icon: ClipboardList },
  { title: "Overview", url: "/owner-console", icon: LayoutDashboard, end: true },
  { title: "Content Editor", url: "/owner-console/content", icon: FileEdit },
  { title: "Challenge Days", url: "/owner-console/challenge-days", icon: ListChecks },
  { title: "Analytics", url: "/owner-console/analytics", icon: BarChart3 },
  
  { title: "Signups", url: "/owner-console/signups", icon: UserPlus },
  { title: "Waitlist", url: "/owner-console/waitlist", icon: Mail },
  { title: "Waitlist Email", url: "/owner-console/waitlist-email", icon: Mail },
  { title: "Newsletter", url: "/owner-console/newsletter", icon: Mail },
  { title: "Promoters", url: "/owner-console/promoters", icon: Users },
  { title: "Activity Feed", url: "/owner-console/activity", icon: Activity },
  { title: "Training System", url: "/owner-console/training", icon: GraduationCap },
  { title: "View as User", url: "/owner-console/view-as-user", icon: Eye },
  { title: "Diagnostic Chat", url: "/owner-console/diagnostic-responses", icon: MessageCircle },
  { title: "Feature Overview", url: "/owner-console/features", icon: FileText },
  { title: "Coupons", url: "/owner-console/coupons", icon: Tag },
  { title: "JV Partners", url: "/owner-console/jv-partners", icon: Handshake },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate("/join", { replace: true });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">Owner Console</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Challenge</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.end
                  ? location.pathname === item.url
                  : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <NavLink to={item.url} end={item.end}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Site</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Landing page">
                  <a href="/" target="_blank" rel="noopener noreferrer">
                    <Home className="h-4 w-4" />
                    <span>Landing page</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} tooltip="Log out">
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
