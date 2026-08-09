import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { getReferralUrl } from "@/lib/utils";

const DISMISS_KEY = "leadtree_access_grace_banner_dismissed";

export const AccessGraceBanner = ({ invitesNeeded }: { invitesNeeded: number }) => {
  const navigate = useNavigate();
  const { state } = useAppState();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const url = getReferralUrl("/", state.user?.inviteCode);

  const copy = async () => {
    if (!url) {
      toast.error("Your invite link is not ready yet");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div className="relative z-[60] w-full bg-[#BA7517] px-4 py-3 text-center text-sm text-white">
      <span>
        Your free access expires in 24 hours. Invite {invitesNeeded} more{" "}
        {invitesNeeded === 1 ? "person" : "people"} to keep it free.
      </span>{" "}
      <button
        type="button"
        onClick={copy}
        className="mx-1 font-semibold text-white underline underline-offset-2"
      >
        Copy invite link
      </button>
      <button
        type="button"
        onClick={() => navigate("/premium")}
        className="mx-1 font-semibold text-white underline underline-offset-2"
      >
        Upgrade for $97/month
      </button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default AccessGraceBanner;
