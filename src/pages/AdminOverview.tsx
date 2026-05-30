import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FeatureOverviewPage from "@/pages/FeatureOverviewPage";
import Workflow from "@/pages/Workflow";
import UserFeaturesAudit from "@/pages/UserFeaturesAudit";

const TABS = ["features", "workflow", "audit"] as const;
type Tab = typeof TABS[number];

const AdminOverview = () => {
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const active: Tab = (TABS as readonly string[]).includes(raw ?? "") ? (raw as Tab) : "features";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Product Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Features, workflow, and route audit — everything that describes what the product is and how it's wired up.
        </p>
      </div>

      <Tabs
        value={active}
        onValueChange={(v) => {
          const next = new URLSearchParams(params);
          next.set("tab", v);
          setParams(next, { replace: true });
        }}
      >
        <TabsList>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="audit">Route Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="mt-4">
          <FeatureOverviewPage mode="admin" />
        </TabsContent>
        <TabsContent value="workflow" className="mt-4">
          <Workflow />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <UserFeaturesAudit />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminOverview;
