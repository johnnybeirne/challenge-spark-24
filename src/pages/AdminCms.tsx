import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import CmsLanding from "@/components/cms/CmsLanding";
import CmsAssessment from "@/components/cms/CmsAssessment";
import CmsChallenge from "@/components/cms/CmsChallenge";
import CmsRewards from "@/components/cms/CmsRewards";
import CmsReferrals from "@/components/cms/CmsReferrals";
import CmsCommunity from "@/components/cms/CmsCommunity";
import CmsBranding from "@/components/cms/CmsBranding";
import CmsPartners from "@/components/cms/CmsPartners";
import CmsNotifications from "@/components/cms/CmsNotifications";
import CmsGlobal from "@/components/cms/CmsGlobal";
import CmsCopilot from "@/components/cms/CmsCopilot";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const SECTIONS = [
  { id: "landing", label: "Landing Page", previewPath: "/" },
  { id: "assessment", label: "Assessment", previewPath: "/assessment" },
  { id: "challenge", label: "Challenge Content", previewPath: "/challenge" },
  { id: "rewards", label: "Rewards & Unlocks", previewPath: "/rewards" },
  { id: "referrals", label: "Referral Settings", previewPath: "/referrals" },
  { id: "community", label: "Community & Builder Circle", previewPath: "/community" },
  { id: "branding", label: "Branding & Design", previewPath: "/" },
  { id: "partners", label: "Partner Settings", previewPath: "/partners" },
  { id: "notifications", label: "Notifications & Copy", previewPath: "/dashboard" },
  { id: "copilot", label: "Johnny B AI (Copilot)", previewPath: "/dashboard" },
  { id: "global", label: "Global Settings", previewPath: "/" },
] as const;

const ADMIN_LINKS = [
  { path: "/owner-console", label: "Hub" },
  { path: "/owner-console/analytics", label: "Analytics" },
  { path: "/owner-console/cms", label: "CMS" },
  { path: "/owner-console/promoters", label: "Promoters" },
];

const AdminCms = () => {
  const [activeSection, setActiveSection] = useState<string>("landing");
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  const renderSection = () => {
    switch (activeSection) {
      case "landing": return <CmsLanding />;
      case "assessment": return <CmsAssessment />;
      case "challenge": return <CmsChallenge />;
      case "rewards": return <CmsRewards />;
      case "referrals": return <CmsReferrals />;
      case "community": return <CmsCommunity />;
      case "branding": return <CmsBranding />;
      case "partners": return <CmsPartners />;
      case "notifications": return <CmsNotifications />;
      case "copilot": return <CmsCopilot />;
      case "global": return <CmsGlobal />;
      default: return <CmsLanding />;
    }
  };

  const sidebarNav = (
    <nav className="flex-1 p-2 space-y-0.5">
      {SECTIONS.map((section) => (
        <button
          key={section.id}
          onClick={() => { setActiveSection(section.id); setSheetOpen(false); }}
          className={cn(
            "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
            activeSection === section.id
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );

  const sidebarHeader = (
    <div className="p-4 border-b">
      <h2 className="font-bold text-sm">Admin CMS</h2>
      <div className="flex gap-2 mt-2 flex-wrap">
        {ADMIN_LINKS.map((link) => (
          <a key={link.path} href={link.path} className="text-xs text-muted-foreground hover:text-foreground">
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen">
        <header className="flex items-center gap-2 p-3 border-b bg-card sticky top-0 z-10">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-56 p-0">
              {sidebarHeader}
              {sidebarNav}
            </SheetContent>
          </Sheet>
          <span className="text-sm font-medium">{SECTIONS.find((s) => s.id === activeSection)?.label}</span>
        </header>
        <main className="p-4 max-w-2xl overflow-y-auto">
          {renderSection()}
        </main>
      </div>
    );
  }

  const activeMeta = SECTIONS.find((s) => s.id === activeSection);

  return (
    <div className="flex min-h-screen h-screen">
      <aside className="w-60 border-r bg-card flex flex-col shrink-0 overflow-y-auto">
        {sidebarHeader}
        {sidebarNav}
      </aside>
      <main className="flex-1 min-w-0 overflow-y-auto bg-muted/20">
        <div className="flex items-center justify-between px-6 py-3 border-b bg-card sticky top-0 z-10">
          <h1 className="text-sm font-semibold">{activeMeta?.label}</h1>
          {activeMeta && (
            <a
              href={activeMeta.previewPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Preview in new tab
            </a>
          )}
        </div>
        <div className="p-6 max-w-3xl">{renderSection()}</div>
      </main>
    </div>
  );
};

export default AdminCms;
