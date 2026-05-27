import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Routes where a back button is unhelpful (top-level / entry / nav-tab destinations).
const HIDE_ON_EXACT = new Set<string>([
  "/",
  "/challenger-dashboard",
  "/challenge",
  "/unlocks",
  "/referrals",
  "/blueprint",
  "/premium",
  "/partners",
  "/waitlist",
  "/assessment",
  "/free-assessment",
  "/premium-assessment",
  "/challenge/join",
  "/blueprint/join",
  "/owner-console",
  "/admin",
  "/let-me-in",
]);

// Pattern matches for routes with dynamic segments where the page itself owns its back UX.
const HIDE_ON_PATTERN: RegExp[] = [
  /^\/challenge\/day-\d+$/,
  /^\/day\/\d+$/,
];

interface Props {
  className?: string;
  fallback?: string;
  label?: string;
}

/**
 * Smart back button. Hides on top-level routes. Uses browser history when
 * available, otherwise falls back to a sensible parent route.
 */
const BackButton = ({ className, fallback = "/challenger-dashboard", label = "Back" }: Props) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (HIDE_ON_EXACT.has(pathname)) return null;

  const handleClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <div className={cn("px-4 pt-4 lg:px-6", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
        aria-label="Go back"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-semibold">{label}</span>
      </Button>
    </div>
  );
};

export default BackButton;
