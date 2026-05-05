import { useEffect, useState } from "react";
import { loadTrainingContent, subscribeTrainingContent, type TrainingContent } from "@/lib/trainingContent";

export function useTrainingContent(): TrainingContent {
  const [content, setContent] = useState<TrainingContent>(() => loadTrainingContent());
  useEffect(() => {
    const reload = () => setContent(loadTrainingContent());
    return subscribeTrainingContent(reload);
  }, []);
  return content;
}
