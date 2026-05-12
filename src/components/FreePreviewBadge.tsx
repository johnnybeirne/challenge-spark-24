import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, X } from "lucide-react";
import {
  getPreviewTier,
  setPreviewTier,
  PREVIEW_TIER_CHANGED_EVENT,
  type PreviewTier,
} from "@/lib/previewTier";

/**
 * Floating badge shown whenever a preview-tier override is active.
 * Lets admin/dev exit the preview and return to the real subscription state.
 */
const FreePreviewBadge = () => {
  const [tier, setTier] = useState<PreviewTier>(() => getPreviewTier());
  const navigate = useNavigate();

  useEffect(() => {
    const update = () => setTier(getPreviewTier());
    window.addEventListener(PREVIEW_TIER_CHANGED_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(PREVIEW_TIER_CHANGED_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  if (!tier) return null;

  const exit = () => {
    setPreviewTier(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("previewTier");
      window.history.replaceState({}, "", url.toString());
    } catch {}
    navigate("/user-dashboard", { replace: true });
  };

  const isFree = tier === "free";
  const styles = isFree
    ? "border-amber-500/40 bg-amber-500 text-amber-950"
    : "border-emerald-500/40 bg-emerald-500 text-emerald-950";
  const btn = isFree
    ? "bg-amber-950/15 text-amber-950 hover:bg-amber-950/25"
    : "bg-emerald-950/15 text-emerald-950 hover:bg-emerald-950/25";
  const label = isFree ? "Free Preview Mode" : "Paid Preview Mode";

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] -translate-x-1/2">
      <div className={`pointer-events-auto flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wider shadow-lg ${styles}`}>
        <Eye className="h-3.5 w-3.5" />
        {label}
        <button
          onClick={exit}
          className={`ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${btn}`}
          title="Clear Preview"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      </div>
    </div>
  );
};

export default FreePreviewBadge;
