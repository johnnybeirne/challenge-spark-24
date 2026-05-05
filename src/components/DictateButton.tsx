import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  isListening: boolean;
  onToggle: () => void;
  className?: string;
  title?: string;
}

const DictateButton = ({ isListening, onToggle, className, title }: Props) => (
  <button
    type="button"
    onClick={onToggle}
    title={title || (isListening ? "Stop dictation" : "Dictate with your voice")}
    aria-label={isListening ? "Stop dictation" : "Start dictation"}
    className={cn(
      "absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center gap-1.5 rounded-full transition-colors",
      isListening
        ? "h-10 px-3 bg-destructive text-destructive-foreground animate-pulse"
        : "h-10 w-10 bg-primary/10 text-primary hover:bg-primary/20",
      className
    )}
  >
    {isListening ? (
      <>
        <span className="text-sm font-semibold">Stop</span>
        <Square className="h-3.5 w-3.5" fill="currentColor" />
      </>
    ) : (
      <Mic className="h-4 w-4" />
    )}
  </button>
);

export default DictateButton;
