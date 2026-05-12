import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, X } from "lucide-react";
import {
  isFreePreviewActive,
  setFreePreview,
  PREVIEW_TIER_CHANGED_EVENT,
} from "@/lib/previewTier";

/**
 * Floating badge shown whenever the Free-Tier Preview override is active.
 * Lets the user exit the preview and return to their real (paid) experience.
 */
const FreePreviewBadge = () => {
  const [active, setActive] = useState<boolean>(() => isFreePreviewActive());
  const navigate = useNavigate();

  useEffect(() => {
    const update = () => setActive(isFreePreviewActive());
    window.addEventListener(PREVIEW_TIER_CHANGED_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(PREVIEW_TIER_CHANGED_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  if (!active) return null;

  const exit = () => {
    setFreePreview(false);
    // Strip ?previewTier from URL if present
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("previewTier");
      window.history.replaceState({}, "", url.toString());
    } catch {}
    navigate("/user-dashboard", { replace: true });
  };

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-amber-950 shadow-lg">
        <Eye className="h-3.5 w-3.5" />
        Free Preview Mode
        <button
          onClick={exit}
          className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-950/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-950 hover:bg-amber-950/25"
          title="Exit Free Preview"
        >
          <X className="h-3 w-3" /> Exit
        </button>
      </div>
    </div>
  );
};

export default FreePreviewBadge;
