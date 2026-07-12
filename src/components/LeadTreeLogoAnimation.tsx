/**
 * Animated LeadTree sapling mark.
 * Draws sequentially: roots → stem → left leaf → right leaf → top leaf, then loops.
 * Colours match the LeadTree logo.
 */
interface LeadTreeLogoAnimationProps {
  size?: number;
  className?: string;
}

const LeadTreeLogoAnimation = ({ size = 96, className }: LeadTreeLogoAnimationProps) => {
  return (
    <>
      <style>{`
        .leadtree-sapling path {
          fill: transparent;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: var(--len);
          stroke-dashoffset: var(--len);
        }
        @keyframes lt-roots-kf  { 0%{stroke-dashoffset:var(--len);} 15%,100%{stroke-dashoffset:0;} }
        @keyframes lt-stem-kf   { 0%,15%{stroke-dashoffset:var(--len);} 30%,100%{stroke-dashoffset:0;} }
        @keyframes lt-leafL-kf  { 0%,30%{stroke-dashoffset:var(--len);} 50%,100%{stroke-dashoffset:0;} }
        @keyframes lt-leafR-kf  { 0%,50%{stroke-dashoffset:var(--len);} 70%,100%{stroke-dashoffset:0;} }
        @keyframes lt-leafT-kf  { 0%,70%{stroke-dashoffset:var(--len);} 88%,100%{stroke-dashoffset:0;} }
        @keyframes lt-leafL-fill { 0%,45%{fill:transparent;} 55%,100%{fill:#8BC34A;} }
        @keyframes lt-leafR-fill { 0%,65%{fill:transparent;} 75%,100%{fill:#8BC34A;} }
        @keyframes lt-leafT-fill { 0%,83%{fill:transparent;} 92%,100%{fill:#2E7D32;} }

        .leadtree-sapling .lt-roots  { animation: lt-roots-kf 3s ease-in-out infinite; }
        .leadtree-sapling .lt-stem   { animation: lt-stem-kf 3s ease-in-out infinite; }
        .leadtree-sapling .lt-leafL  { animation: lt-leafL-kf 3s ease-in-out infinite, lt-leafL-fill 3s ease-in-out infinite; }
        .leadtree-sapling .lt-leafR  { animation: lt-leafR-kf 3s ease-in-out infinite, lt-leafR-fill 3s ease-in-out infinite; }
        .leadtree-sapling .lt-leafT  { animation: lt-leafT-kf 3s ease-in-out infinite, lt-leafT-fill 3s ease-in-out infinite; }
      `}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
        className={`leadtree-sapling ${className ?? ""}`}
        aria-hidden="true"
      >
        <path
          className="lt-roots"
          d="M14 36 Q17 33 20 34 M26 36 Q23 33 20 34 M20 36 L20 34"
          stroke="#1F2937"
          strokeWidth={1.6}
          pathLength={30}
          style={{ ["--len" as any]: 30 }}
        />
        <path
          className="lt-stem"
          d="M20 34 L20 14"
          stroke="#1F2937"
          strokeWidth={2}
          pathLength={20}
          style={{ ["--len" as any]: 20 }}
        />
        <path
          className="lt-leafL"
          d="M20 20 C 14 20 10 16 10 12 C 15 12 19 15 20 20 Z"
          stroke="#7CB342"
          strokeWidth={1.4}
          pathLength={30}
          style={{ ["--len" as any]: 30 }}
        />
        <path
          className="lt-leafR"
          d="M20 20 C 26 20 30 16 30 12 C 25 12 21 15 20 20 Z"
          stroke="#7CB342"
          strokeWidth={1.4}
          pathLength={30}
          style={{ ["--len" as any]: 30 }}
        />
        <path
          className="lt-leafT"
          d="M20 14 C 16 12 16 7 20 3 C 24 7 24 12 20 14 Z"
          stroke="#2E7D32"
          strokeWidth={1.4}
          pathLength={30}
          style={{ ["--len" as any]: 30 }}
        />
      </svg>
    </>
  );
};

export default LeadTreeLogoAnimation;
