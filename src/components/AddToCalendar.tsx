import { CalendarPlus, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppState } from "@/context/AppContext";
import { buildChallengeEvents, downloadChallengeIcs, googleCalendarUrl } from "@/lib/calendarSchedule";
import { trackEvent } from "@/lib/analytics";

const AddToCalendar = ({ variant = "default", className = "" }: { variant?: "default" | "secondary" | "outline"; className?: string }) => {
  const { state, setState } = useAppState();
  const firstName = state.user?.name?.split(" ")[0] || state.memory.name?.split(" ")[0] || "there";
  const events = buildChallengeEvents(firstName, state.memory, state.challenge.startedAt);

  const markAdded = () => {
    setState((prev) => ({ ...prev, challenge: { ...prev.challenge, calendarAdded: true } }));
    toast.success(`Your challenge schedule is set, ${firstName}`);
  };

  const openGoogle = () => {
    trackEvent("calendar_google_selected");
    events.forEach((event, index) => {
      window.open(googleCalendarUrl(event), index === 0 ? "_blank" : `_blank_day_${event.day}`, "noopener,noreferrer");
    });
    markAdded();
  };

  const downloadIcs = (provider: "apple" | "outlook") => {
    trackEvent("calendar_ics_downloaded", { provider });
    downloadChallengeIcs(events);
    markAdded();
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && trackEvent("calendar_add_clicked")}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} className={`gap-2 ${className}`}>
          <CalendarPlus className="h-4 w-4" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={openGoogle} className="gap-2">
          <ExternalLink className="h-4 w-4" /> Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadIcs("apple")} className="gap-2">
          <Download className="h-4 w-4" /> Apple Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadIcs("outlook")} className="gap-2">
          <Download className="h-4 w-4" /> Outlook
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddToCalendar;