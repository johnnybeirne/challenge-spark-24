import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateQaState } from "@/lib/qaPreview";
import { computeSimulatedTiming, describeSimulatedDay } from "@/lib/simulatedDate";
import { useQaPreview } from "@/hooks/useQaPreview";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
    {children}
  </div>
);

const QaSimulatedDate = () => {
  const qa = useQaPreview();
  const initial = qa.simulatedJoinedAt ? new Date(qa.simulatedJoinedAt) : new Date();
  const [picked, setPicked] = useState<Date | undefined>(initial);

  const apply = () => {
    if (!picked) return;
    // Anchor to "same time of day as now" so the elapsed-hours math is intuitive.
    const now = new Date();
    const merged = new Date(picked);
    merged.setHours(now.getHours(), now.getMinutes(), 0, 0);
    updateQaState({ active: true, simulatedJoinedAt: merged.toISOString() });
  };

  const clear = () => {
    setPicked(new Date());
    updateQaState({ simulatedJoinedAt: null });
  };

  const active = !!qa.simulatedJoinedAt;
  const timing = active ? computeSimulatedTiming(qa.simulatedJoinedAt!) : null;

  return (
    <div className="space-y-1.5 rounded-md border border-primary/40 bg-primary/5 p-2">
      <SectionLabel>Simulated Signup Date</SectionLabel>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-full justify-start text-left font-normal h-8 text-xs",
              !picked && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {picked ? format(picked, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[100]" align="start">
          <Calendar
            mode="single"
            selected={picked}
            onSelect={setPicked}
            disabled={(d) => d > new Date()}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={apply}
          className="rounded border border-primary bg-primary px-2 py-1 text-[11px] font-black uppercase tracking-wider text-primary-foreground hover:opacity-90"
        >
          Apply
        </button>
        <button
          onClick={clear}
          disabled={!active}
          className="rounded border border-border bg-background px-2 py-1 text-[11px] font-bold uppercase hover:bg-muted disabled:opacity-50"
        >
          Clear
        </button>
      </div>
      {timing && (
        <p className="text-[10px] leading-snug text-foreground">
          {describeSimulatedDay(timing)}
        </p>
      )}
      <p className="text-[10px] leading-snug text-muted-foreground">
        Backdates your joined date + Day 1 start for this browser only. Nothing is saved to the database.
      </p>
    </div>
  );
};

export default QaSimulatedDate;
