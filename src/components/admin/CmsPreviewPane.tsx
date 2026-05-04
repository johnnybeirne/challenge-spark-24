import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, RefreshCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface CmsPreviewPaneProps {
  /** Path to load in the iframe, e.g. "/", "/join", "/results" */
  path: string;
  /** Label shown above the preview */
  label: string;
}

const CmsPreviewPane = ({ path, label }: CmsPreviewPaneProps) => {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [version, setVersion] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Note: do NOT auto-bump version on path change — the `key` below already
  // remounts the iframe per path. Bumping version here caused a double-load flash.

  const src = `${path}${path.includes("?") ? "&" : "?"}cmsPreview=1&v=${version}`;

  return (
    <div className="flex flex-col h-full bg-muted/30 border-l">
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview</span>
          <span className="text-sm truncate">{label}</span>
          <code className="text-xs text-muted-foreground hidden md:inline">{path}</code>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant={device === "desktop" ? "secondary" : "ghost"}
            onClick={() => setDevice("desktop")}
            className="h-8 w-8 p-0"
            aria-label="Desktop preview"
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={device === "mobile" ? "secondary" : "ghost"}
            onClick={() => setDevice("mobile")}
            className="h-8 w-8 p-0"
            aria-label="Mobile preview"
          >
            <Smartphone className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setVersion((v) => v + 1)}
            className="h-8 w-8 p-0"
            aria-label="Refresh preview"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0" aria-label="Open in new tab">
            <a href={path} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
        <div
          className={cn(
            "bg-background shadow-sm border rounded-lg overflow-hidden transition-all",
            device === "desktop" ? "w-full h-full min-h-[600px]" : "w-[390px] h-[780px]"
          )}
        >
          <iframe
            ref={iframeRef}
            key={`${path}-${version}`}
            src={src}
            title={`Preview of ${label}`}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};

export default CmsPreviewPane;
