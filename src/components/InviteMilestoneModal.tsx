import { useEffect, useState } from "react";
import { useAppState } from "@/context/AppContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const MILESTONE_KEY = "challengeos_invite_milestone_shown";

const InviteMilestoneModal = () => {
  const { state } = useAppState();
  const [open, setOpen] = useState(false);
  const invites = state.network.direct || 0;

  useEffect(() => {
    if (invites >= 3) {
      try {
        const shown = sessionStorage.getItem(MILESTONE_KEY);
        if (!shown) {
          setOpen(true);
          sessionStorage.setItem(MILESTONE_KEY, "1");
          trackEvent("onboarding_invite_completed");
        }
      } catch {}
    }
  }, [invites]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="items-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-xl">You're building momentum</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            You've unlocked faster progress and visibility inside the network.
          </DialogDescription>
        </DialogHeader>
        <Button className="w-full mt-2" onClick={() => setOpen(false)}>
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMilestoneModal;
