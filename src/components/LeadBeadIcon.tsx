import { SVGProps } from "react";

/**
 * LeadBead brand icon — 3 beads on a string.
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
    aria-label="LeadBead"
    className={className}
    {...props}
  >
    <line
      x1="4"
      y1="12"
      x2="20"
      y2="12"
      stroke="#FF8A5C"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <circle cx="4" cy="12" r="2.5" fill="#F65127" />
    <circle cx="12" cy="12" r="3.5" fill="#F65127" />
    <circle cx="20" cy="12" r="2.5" fill="#F65127" />
  </svg>
);

export default LeadBeadIcon;
