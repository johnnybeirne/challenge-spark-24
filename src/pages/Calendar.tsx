import { useAppState } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Video } from "lucide-react";

const cohortDays = [
  { day: 1, label: "Day 1", weekday: "Monday" },
  { day: 2, label: "Day 2", weekday: "Tuesday" },
  { day: 3, label: "Day 3", weekday: "Wednesday" },
];

const events = [
  { id: 1, title: "Challenge kickoff Q&A", day: 1, date: "Monday", time: "12:00 PM EST" },
  { id: 2, title: "Day 2 office hours", day: 2, date: "Tuesday", time: "1:00 PM EST" },
  { id: 3, title: "Launch review session", day: 3, date: "Wednesday", time: "2:00 PM EST" },
];

const Calendar = () => {
  const { state } = useAppState();
  const currentDay = state.challenge?.currentDay ?? 1;

  return (
    <div className="app-page-container py-6 pb-24 lg:py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live sessions</h1>
        <p className="text-sm text-muted-foreground mt-1">Your cohort schedule</p>
      </div>

      {/* Cohort timeline */}
      <div className="grid grid-cols-3 gap-2">
        {cohortDays.map((d) => {
          const isCurrent = currentDay === d.day;
          return (
            <div
              key={d.day}
              className={`flex-1 rounded-lg border p-3 text-center text-sm transition-colors ${
                isCurrent
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border text-muted-foreground"
              }`}
            >
              <div className="font-medium">{d.label}</div>
              <div className="text-xs">{d.weekday}</div>
            </div>
          );
        })}
      </div>

      {/* Event cards */}
      <div className="space-y-3">
        {events.length > 0 ? (
          events.map((ev) => (
            <Card key={ev.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-primary/10 p-2">
                    <Video className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {ev.date} · {ev.time}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Join
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming sessions — keep building</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
