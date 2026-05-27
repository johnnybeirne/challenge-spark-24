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
    title={title || (isListening ? "Stop dictation" : "Speak")}
    aria-label={isListening ? "Stop dictation" : "Speak"}
    className={cn(
      "absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center gap-1.5 rounded-full h-10 px-3 font-semibold text-sm transition-colors",
      isListening
        ? "bg-destructive text-destructive-foreground animate-pulse"
        : "bg-orange-500 text-white hover:bg-orange-600",
      className
    )}
  >
    {isListening ? (
      <>
        <span>Stop</span>
        <Square className="h-3.5 w-3.5" fill="currentColor" />
      </>
    ) : (
      <>
        <Mic className="h-4 w-4" />
        <span>Speak</span>
      </>
    )}
  </button>
);

export default DictateButton;
