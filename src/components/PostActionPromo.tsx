import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CrossPromoSpotlight from "@/components/CrossPromoSpotlight";

interface PostActionPromoProps {
  open: boolean;
  onClose: () => void;
  position?: string;
}

/**
 * Lightweight modal shown after key actions (task complete, invite, unlock).
 */
const PostActionPromo = ({ open, onClose, position = "post-action" }: PostActionPromoProps) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm p-5">
        <div className="text-center mb-4">
          <h3 className="text-base font-semibold text-foreground">See another builder</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Builders in this network support each other
          </p>
        </div>
        <CrossPromoSpotlight
          title="From the network"
          subtitle=""
          position={position}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PostActionPromo;
