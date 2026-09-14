import { useEffect, useRef, useState } from "react";

/**
 * Reveal an element only when it scrolls into view. Respects
 * prefers-reduced-motion by reporting in-view immediately so content
 * shows with no transform/animation.
 *
 * `enabled` (default true) gates the observer: while false the element
 * stays hidden even if it is already on screen, so content can be held
 * back until the person has started scrolling.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit & { enabled?: boolean },
  once = true,
) {
  const enabled = options?.enabled ?? true;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) obs.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px", ...options },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [enabled, once]);

  return { ref, inView } as const;
}
