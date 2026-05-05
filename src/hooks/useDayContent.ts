import { useEffect, useState } from "react";
import { loadDayContent, subscribeDayContent, type DayContent } from "@/lib/dayContent";

export function useDayContent(): DayContent {
  const [content, setContent] = useState<DayContent>(() => loadDayContent());
  useEffect(() => {
    const reload = () => setContent(loadDayContent());
    return subscribeDayContent(reload);
  }, []);
  return content;
}
