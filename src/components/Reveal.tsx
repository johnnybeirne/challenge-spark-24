import { type ReactNode } from "react";
import { useInView } from "@/hooks/useInView";

/**
 * Fades + slides its children in only when scrolled into view. With
 * prefers-reduced-motion the content is shown immediately with no motion.
 *
 * `enabled` (default true) holds the content hidden until it flips true,
 * so deeper content can be held back until the person has scrolled.
 */
const Reveal = ({
  children,
  className = "",
  delay = 0,
  enabled = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  enabled?: boolean;
}) => {
  const { ref, inView } = useInView<HTMLDivElement>({ enabled });
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
};

export default Reveal;
