import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";

/**
 * Role-aware "Training Home" link used inside the shared
 * Build-a-Challenge-Framework training area.
 *
 * Routes signed-in users to the correct home for their role
 * — never to a join/signup page.
 */
const TrainingHomeLink = ({ className }: { className?: string }) => {
  const { role } = useUserRole();

  const href =
    role === "challenger"
      ? "/challenger-dashboard"
      : role === "premium_user"
      ? "/premium"
      : role === "partner"
      ? "/promoter"
      : role === "admin"
      ? "/owner-console"
      : // free_student + visitor land on the free training home
        "/blueprint/dashboard";

  return (
    <Link
      to={href}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground hover:text-foreground",
        className
      )}
    >
      <ArrowLeft className="h-3 w-3" /> Training Home
    </Link>
  );
};

export default TrainingHomeLink;
