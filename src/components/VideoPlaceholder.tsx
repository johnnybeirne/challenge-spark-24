import { PlayCircle } from "lucide-react";

export default function VideoPlaceholder() {
  return (
    <div className="w-full rounded-xl border border-border bg-muted flex flex-col items-center justify-center gap-3 aspect-video">
      <PlayCircle className="h-12 w-12 text-muted-foreground/60" />
      <span className="text-sm font-medium text-muted-foreground">Video coming soon</span>
    </div>
  );
}
