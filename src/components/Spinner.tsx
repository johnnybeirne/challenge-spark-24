import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeMap = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };

const Spinner = ({ className, size = "md", label }: SpinnerProps) => (
  <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
    <Loader2 className={cn("animate-spin text-primary", sizeMap[size])} />
    {label && <p className="text-xs text-muted-foreground animate-pulse">{label}</p>}
  </div>
);

export default Spinner;
