import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, BarChart3, Settings, Users, Activity, Shield, Sparkles, FileText } from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Overview", url: "/owner-console", icon: LayoutDashboard, end: true },
  { title: "Analytics", url: "/owner-console/analytics", icon: BarChart3 },
  { title: "CMS", url: "/owner-console/cms", icon: Settings },
  { title: "Promoters", url: "/owner-console/promoters", icon: Users },
  { title: "Activity Feed", url: "/owner-console/activity", icon: Activity },
  { title: "Features Built", url: "/owner-console/features", icon: Sparkles },
  { title: "Feature Overview", url: "/admin/features", icon: FileText },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

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
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Leadio</span>
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
      </SidebarContent>
    </Sidebar>
  );
}
