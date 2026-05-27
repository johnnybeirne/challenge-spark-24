import * as React from "react";
import { Mic, RotateCcw, Square } from "lucide-react";
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
          className={cn(isSupported ? "pr-32" : "pr-10", className)}
          {...props}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          {value && (
            <button
              type="button"
              onClick={() => {
                baseRef.current = "";
                emit("");
              }}
              title="Start again"
              aria-label="Start again"
              className="flex h-8 items-center justify-center gap-1 rounded-full border border-border bg-background px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Start again</span>
            </button>
          )}
          {isSupported && (
            <button
              type="button"
              onClick={handleToggle}
              title={isListening ? "Stop dictation" : "Speak"}
              aria-label={isListening ? "Stop dictation" : "Speak"}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-full h-8 px-3 text-xs font-semibold transition-colors",
                isListening
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : "bg-orange-500 text-white hover:bg-orange-600",
              )}
            >
              {isListening ? (
                <>
                  <span>Stop</span>
                  <Square className="h-3 w-3" fill="currentColor" />
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5" />
                  <span>Speak</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    );
  }
);
DictatedTextarea.displayName = "DictatedTextarea";

export default DictatedTextarea;
