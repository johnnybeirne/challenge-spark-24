import { useEffect, useRef, useState } from "react";

/**
 * ReferralGrowthNetwork
 * Premium, living referral tree visual. Self-contained — no props required.
 * - Root + 3 tiers (1 → 3 → 6 → 12) of avatar-style nodes
 * - SVG stroke-dashoffset line draw + SMIL particle travel
 * - CSS keyframe pulse on nodes, scroll-triggered entrance choreography
 * - Uses semantic --primary accent token only
 */

type Node = {
  id: string;
  x: number;
  y: number;
  parent: string | null;
  level: 0 | 1 | 2 | 3;
  name: string;
};

const NAMES_T1 = ["Sarah", "James", "Priya"];
const NAMES_T2 = ["Maya", "Leo", "Aisha", "Marco", "Noor", "Theo"];
const NAMES_T3 = ["Kai", "Eli", "Ines", "Omar", "Zara", "Finn", "Luca", "Mira", "Tomi", "Anya", "Rhys", "Beau"];

const initials = (name: string, root = false) => {
  if (root) return "YOU";
  return name.slice(0, 2).toUpperCase();
};

// Canvas: 400 × 340
const ROOT: Node = { id: "r", x: 200, y: 30, parent: null, level: 0, name: "You" };

const TIER1: Node[] = [80, 200, 320].map((x, i) => ({
  id: `t1-${i}`, x, y: 132, parent: "r", level: 1, name: NAMES_T1[i],
}));

const TIER2: Node[] = (() => {
  // each tier1 has 2 children, slightly fanned
  const out: Node[] = [];
  TIER1.forEach((p, i) => {
    [-46, 46].forEach((dx, j) => {
      out.push({
        id: `t2-${i}-${j}`,
        x: Math.max(28, Math.min(372, p.x + dx)),
        y: 218,
        parent: p.id,
        level: 2,
        name: NAMES_T2[i * 2 + j],
      });
    });
  });
  return out;
})();

const TIER3: Node[] = (() => {
  const out: Node[] = [];
  TIER2.forEach((p, i) => {
    [-22, 22].forEach((dx, j) => {
      out.push({
        id: `t3-${i}-${j}`,
        x: Math.max(20, Math.min(380, p.x + dx)),
        y: 296,
        parent: p.id,
        level: 3,
        name: NAMES_T3[i * 2 + j],
      });
    });
  });
  return out;
})();

const ALL_NODES: Node[] = [ROOT, ...TIER1, ...TIER2, ...TIER3];

const radiusFor = (level: number) => (level === 0 ? 24 : level === 1 ? 18 : level === 2 ? 15 : 12);
const opacityFor = (level: number) => (level === 0 ? 1 : level === 1 ? 1 : level === 2 ? 0.85 : 0.7);

// Entrance delay (ms) by node — keyed off scroll progress thresholds in spec
const delayFor = (n: Node, idxInLevel: number): number => {
  if (n.level === 0) return 0;
  if (n.level === 1) return 350 + idxInLevel * 150;
  if (n.level === 2) return 950 + idxInLevel * 80;
  return 1500 + idxInLevel * 50;
};

const lineDelayFor = (childLevel: number, idx: number): number => {
  if (childLevel === 1) return 250 + idx * 120;
  if (childLevel === 2) return 880 + idx * 70;
  return 1450 + idx * 45;
};

export default function ReferralGrowthNetwork({ className = "" }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // index nodes within their level for stagger
  const tier1Idx = new Map(TIER1.map((n, i) => [n.id, i]));
  const tier2Idx = new Map(TIER2.map((n, i) => [n.id, i]));
  const tier3Idx = new Map(TIER3.map((n, i) => [n.id, i]));
  const idxOf = (n: Node) =>
    n.level === 1 ? tier1Idx.get(n.id)! :
    n.level === 2 ? tier2Idx.get(n.id)! :
    n.level === 3 ? tier3Idx.get(n.id)! : 0;

  // edges (parent → child)
  const edges = ALL_NODES.filter((n) => n.parent).map((n) => {
    const p = ALL_NODES.find((x) => x.id === n.parent)!;
    return { id: `e-${n.id}`, from: p, to: n, level: n.level };
  });

  return (
    <div
      ref={wrapRef}
      className={`relative w-full ${className}`}
      style={{ aspectRatio: "400 / 340" }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes rgn-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.04); }
        }
        @keyframes rgn-ring {
          0%, 100% { transform: scale(1); opacity: .55; }
          50%      { transform: scale(1.18); opacity: 0; }
        }
        .rgn-node { transform-box: fill-box; transform-origin: center; }
        .rgn-node-in { animation: rgn-pulse 2s ease-in-out infinite; }
        .rgn-ring   { transform-box: fill-box; transform-origin: center; animation: rgn-ring 2.4s ease-in-out infinite; }
      `}</style>

      {/* Soft radial backdrop */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background:
            "radial-gradient(closest-side at 50% 40%, hsl(var(--primary) / 0.06), transparent 70%)",
        }}
      />

      <svg
        viewBox="0 0 400 340"
        className="absolute inset-0 h-full w-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* EDGES */}
        {edges.map((e, i) => {
          const dx = e.to.x - e.from.x;
          const dy = e.to.y - e.from.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const lineDelay = lineDelayFor(e.level, idxOf(e.to));
          const particleDelay = (i % 7) * 0.28; // s
          return (
            <g key={e.id}>
              <line
                x1={e.from.x} y1={e.from.y} x2={e.to.x} y2={e.to.y}
                stroke="hsl(var(--primary))"
                strokeOpacity={0.4}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeDasharray={len}
                strokeDashoffset={inView ? 0 : len}
                style={{
                  transition: `stroke-dashoffset 500ms ease-out ${lineDelay}ms`,
                }}
              />
              {/* travelling particle */}
              {inView && (
                <circle r="2.4" fill="hsl(var(--primary))" fillOpacity="0.8">
                  <animateMotion
                    dur="2s"
                    repeatCount="indefinite"
                    begin={`${(lineDelay / 1000) + 0.5 + particleDelay}s`}
                    path={`M ${e.from.x} ${e.from.y} L ${e.to.x} ${e.to.y}`}
                  />
                </circle>
              )}
            </g>
          );
        })}

        {/* NODES */}
        {ALL_NODES.map((n) => {
          const r = radiusFor(n.level);
          const isRoot = n.level === 0;
          const delay = delayFor(n, idxOf(n));
          const pulseDelay = ((n.x + n.y) % 1700) / 1000; // s — desync
          return (
            <g
              key={n.id}
              style={{
                opacity: inView ? opacityFor(n.level) : 0,
                transform: inView ? "scale(1)" : "scale(0)",
                transformBox: "fill-box",
                transformOrigin: `${n.x}px ${n.y}px`,
                transition: `transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms, opacity 300ms ease-out ${delay}ms`,
              }}
            >
              {/* pulse ring on root */}
              {isRoot && (
                <circle
                  cx={n.x} cy={n.y} r={r + 4}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeOpacity="0.5"
                  strokeWidth="1.5"
                  className="rgn-ring"
                  style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                />
              )}

              <g
                className="rgn-node rgn-node-in"
                style={{
                  transformOrigin: `${n.x}px ${n.y}px`,
                  animationDelay: `${pulseDelay}s`,
                }}
              >
                <circle
                  cx={n.x} cy={n.y} r={r}
                  fill={isRoot ? "hsl(var(--primary))" : "#ffffff"}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
                <text
                  x={n.x}
                  y={n.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isRoot ? "#ffffff" : "hsl(var(--primary))"}
                  fontSize={isRoot ? 13 : 11}
                  fontWeight={600}
                  style={{ fontFamily: "inherit", letterSpacing: 0.3 }}
                >
                  {initials(n.name, isRoot)}
                </text>
              </g>

              {/* label */}
              <text
                x={n.x}
                y={n.y + r + 11}
                textAnchor="middle"
                fill="currentColor"
                fillOpacity={0.55}
                fontSize={10}
                fontWeight={500}
                style={{ fontFamily: "inherit" }}
              >
                {isRoot ? "You" : n.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
