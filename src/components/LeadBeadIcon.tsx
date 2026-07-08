import { SVGProps } from "react";

/**
 * LeadTree brand icon — a simple tree mark.
 * Works in light + dark mode (fills/stroke are explicit brand colors).
 */
export const LeadBeadIcon = ({
  size = 24,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="LeadTree"
    className={className}
    {...props}
  >
    <path
      d="M12 2C9 6 5 9 5 13c0 2.5 1.5 4.5 4 5.5V22h6v-3.5c2.5-1 4-3 4-5.5 0-4-4-7-7-11z"
      fill="#22C55E"
    />
    <path
      d="M12 22v-6"
      stroke="#16A34A"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="10" r="2" fill="#86EFAC" />
  </svg>
);

export default LeadBeadIcon;
