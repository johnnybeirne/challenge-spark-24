import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Menu } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";

const SECTIONS = [
  { id: "landing", label: "Landing Page" },
  { id: "assessment", label: "Assessment" },
  { id: "challenge", label: "Challenge Content" },
  { id: "rewards", label: "Rewards & Unlocks" },
  { id: "referrals", label: "Referral Settings" },
  { id: "community", label: "Community & Builder Circle" },
  { id: "branding", label: "Branding & Design" },
  { id: "partners", label: "Partner Settings" },
  { id: "notifications", label: "Notifications & Copy" },
  { id: "copilot", label: "Johnny B AI (Copilot)" },
  { id: "global", label: "Global Settings" },
] as const;

const ADMIN_LINKS = [
  { path: "/owner-console", label: "Hub" },
  { path: "/owner-console/analytics", label: "Analytics" },
  { path: "/owner-console/cms", label: "CMS" },
  { path: "/owner-console/promoters", label: "Promoters" },
];

const AdminCms = () => {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("landing");
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  const login = () => {
    if (password === "challengeos2024") {
      setAuthed(true);
    }
  };

  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4">
        <Lock className="h-8 w-8 text-muted-foreground" />
        <h1 className="text-xl font-bold">Admin CMS</h1>
        <div className="flex gap-2 w-full max-w-xs">
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} />
          <Button onClick={login}>Enter</Button>
        </div>
      </div>
    );
  }

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

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-card flex flex-col shrink-0">
        {sidebarHeader}
        {sidebarNav}
      </aside>
      <main className="flex-1 p-6 max-w-2xl overflow-y-auto">
        {renderSection()}
      </main>
    </div>
  );
};

export default AdminCms;
