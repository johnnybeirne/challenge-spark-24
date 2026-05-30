import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import VideoPlaceholder from "@/components/VideoPlaceholder";
import { supabase } from "@/integrations/supabase/client";

interface DayVideoModalProps {
  dayNum: 1 | 2 | 3;
}

const TITLES: Record<1 | 2 | 3, string> = {
  1: "Welcome to Day 1 — Define Your Challenge",
  2: "Day 2 — Build Your Diagnostic Quiz",
  3: "Day 3 — Design the Challenge Experience",
};

const SUBTITLES: Record<1 | 2 | 3, string> = {
  1: "Watch this short briefing before you begin.",
  2: "A quick walkthrough before today's AI session.",
  3: "Watch this before mapping your 3-day arc.",
};

const storageKey = (day: number) => `video_modal_dismissed_day_${day}`;

export default function DayVideoModal({ dayNum }: DayVideoModalProps) {
  const [open, setOpen] = useState(false);
  const [dontShow, setDontShow] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      setUserId(user?.id ?? null);

      let dismissed = false;
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("video_modal_dismissed")
          .eq("user_id", user.id)
          .maybeSingle();
        const map = (data?.video_modal_dismissed ?? {}) as Record<string, boolean>;
        dismissed = !!map[String(dayNum)];
      } else {
        dismissed = localStorage.getItem(storageKey(dayNum)) === "1";
      }
      if (!dismissed) setOpen(true);
    })();
    return () => { cancelled = true; };
  }, [dayNum]);

  const handleOpenChange = async (next: boolean) => {
    setOpen(next);
    if (!next && dontShow) {
      if (userId) {
        const { data } = await supabase
          .from("profiles")
          .select("video_modal_dismissed")
          .eq("user_id", userId)
          .maybeSingle();
        const map = { ...((data?.video_modal_dismissed ?? {}) as Record<string, boolean>), [String(dayNum)]: true };
        await supabase
          .from("profiles")
          .update({ video_modal_dismissed: map })
          .eq("user_id", userId);
      } else {
        localStorage.setItem(storageKey(dayNum), "1");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{TITLES[dayNum]}</DialogTitle>
          <p className="text-sm text-muted-foreground">{SUBTITLES[dayNum]}</p>
        </DialogHeader>
        <VideoPlaceholder />
        <div className="flex items-center gap-2 pt-2">
          <Checkbox
            id={`dont-show-day-${dayNum}`}
            checked={dontShow}
            onCheckedChange={(v) => setDontShow(v === true)}
          />
          <Label htmlFor={`dont-show-day-${dayNum}`} className="text-sm text-muted-foreground font-normal">
            Don't show this again
          </Label>
        </div>
      </DialogContent>
    </Dialog>
  );
}
