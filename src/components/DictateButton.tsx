import { Mic, MicOff } from "lucide-react";
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
      "absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full transition-colors",
      isListening
        ? "bg-destructive text-destructive-foreground animate-pulse"
        : "bg-primary/10 text-primary hover:bg-primary/20",
      className
    )}
  >
    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
  </button>
);

export default DictateButton;
