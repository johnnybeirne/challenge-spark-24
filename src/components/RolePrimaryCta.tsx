// Shared primary CTA driven by useUserRole.
//
// Use this anywhere you'd otherwise hardcode the "next step" button for the
// current user. Label + href come from ROLE_PRIMARY_CTA so all surfaces stay
// in sync with the canonical role system.

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";

type RolePrimaryCtaProps = {
  /** Override the label from the role map (rarely needed). */
  label?: string;
  /** Override the href from the role map (rarely needed). */
  href?: string;
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  showArrow?: boolean;
  /** Hide entirely for these roles (e.g. on a page that already lives at the CTA's target). */
  hideForRoles?: Array<ReturnType<typeof useUserRole>["role"]>;
};

const RolePrimaryCta = ({
  label,
  href,
  className,
  size = "lg",
  variant = "default",
  showArrow = true,
  hideForRoles,
}: RolePrimaryCtaProps) => {
  const { primaryCta, role, loading } = useUserRole();
  if (loading) return null;
  if (hideForRoles?.includes(role)) return null;

  const finalLabel = label ?? primaryCta.label;
  const finalHref = href ?? primaryCta.href;

  return (
    <Button
      asChild
      size={size}
      variant={variant}
      className={cn("gap-2 font-black uppercase", className)}
      data-role={role}
    >
      <Link to={finalHref}>
        {finalLabel}
        {showArrow && <ArrowRight className="h-4 w-4" />}
      </Link>
    </Button>
  );
};

export default RolePrimaryCta;
