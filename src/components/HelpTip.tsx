import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * A small ? icon that reveals editable advice on hover (desktop) and tap (touch).
 * Renders nothing when `text` is empty so admins can hide tips by clearing the field.
 */
export function HelpTip({
  text,
  className,
  label = "Show advice",
}: {
  text?: string | null;
  className?: string;
  label?: string;
}) {
  const value = (text ?? "").trim();
  if (!value) return null;

  return (
    <span className={cn("inline-flex align-middle", className)}>
      {/* Desktop: hover tooltip */}
      <span className="hidden sm:inline-flex">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={label}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
              {value}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </span>
      {/* Mobile: tap popover */}
      <span className="inline-flex sm:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={label}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/70"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="max-w-[260px] text-xs leading-relaxed">
            {value}
          </PopoverContent>
        </Popover>
      </span>
    </span>
  );
}

export default HelpTip;
