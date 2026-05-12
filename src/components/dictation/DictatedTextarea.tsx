import * as React from "react";
import { Mic, Square } from "lucide-react";
import { Textarea, type TextareaProps } from "@/components/ui/textarea";
import { useDictation } from "@/hooks/useDictation";
import { cn } from "@/lib/utils";

interface Props extends Omit<TextareaProps, "onChange"> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onValueChange?: (value: string) => void;
}

const DictatedTextarea = React.forwardRef<HTMLTextAreaElement, Props>(
  ({ className, value, onChange, onValueChange, ...props }, ref) => {
    const { isListening, isSupported, toggle } = useDictation();
    const baseRef = React.useRef<string>("");

    const emit = (next: string) => {
      onValueChange?.(next);
      onChange?.({
        target: { value: next },
        currentTarget: { value: next },
      } as unknown as React.ChangeEvent<HTMLTextAreaElement>);
    };

    const handleToggle = () => {
      if (!isListening) {
        baseRef.current = value ? value.replace(/\s+$/, "") + " " : "";
      }
      toggle((text) => emit((baseRef.current + text).trim()));
    };

    return (
      <div className="relative w-full flex-1 min-w-0">
        <Textarea
          ref={ref}
          value={value}
          onChange={onChange}
          className={cn(isSupported && "pr-12", className)}
          {...props}
        />
        {isSupported && (
          <button
            type="button"
            onClick={handleToggle}
            title={isListening ? "Stop dictation" : "Dictate with your voice"}
            aria-label={isListening ? "Stop dictation" : "Start dictation"}
            className={cn(
              "absolute bottom-2 right-2 flex items-center justify-center rounded-full transition-colors",
              isListening
                ? "h-8 px-2.5 gap-1.5 bg-destructive text-destructive-foreground animate-pulse"
                : "h-8 w-8 bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            {isListening ? (
              <>
                <span className="text-xs font-semibold">Stop</span>
                <Square className="h-3 w-3" fill="currentColor" />
              </>
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    );
  }
);
DictatedTextarea.displayName = "DictatedTextarea";

export default DictatedTextarea;
