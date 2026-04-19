import { ClipboardCheck, TrendingUp, Lock, Megaphone, Crown, Users } from 'lucide-react';

/**
 * Vecto Flywheel — native SVG, exactly 6 nodes + 7 arrows.
 * The 7th arrow sits in the MORE CLIENTS → CLIENT TRACKS sector to
 * visually emphasize the "Repeat" loop-back. All other sectors have 1 arrow.
 *
 * Brand language:
 *  - Background: hsl(var(--background)) (Obsidian black)
 *  - Stroke/accent: hsl(var(--primary)) (Vecto Neon)
 *  - Labels: hsl(var(--foreground)) (white) Inter, uppercase, tracking-wider
 *  - Center wordmark: VECTO with primary "V"
 */

type Node = {
  key: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  /** angle in degrees, 0 = top, clockwise */
  angle: number;
};

const NODES: Node[] = [
  { key: 'tracks', label: 'CLIENT TRACKS', Icon: ClipboardCheck, angle: 0 },
  { key: 'results', label: 'RESULTS COME', Icon: TrendingUp, angle: 60 },
  { key: 'stays', label: 'CLIENT STAYS', Icon: Lock, angle: 120 },
  { key: 'refers', label: 'REFERS FRIENDS', Icon: Megaphone, angle: 180 },
  { key: 'reputation', label: 'REPUTATION GROWS', Icon: Crown, angle: 240 },
  { key: 'clients', label: 'MORE CLIENTS', Icon: Users, angle: 300 },
];

// Geometry
const SIZE = 600;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RING_R = 180;          // arrow ring radius
const NODE_R = 250;          // node icon center radius
const NODE_CIRCLE_R = 28;    // node circle size
const ARROW_GAP_DEG = 6;     // gap between arrows in same sector

const polar = (r: number, angleDeg: number) => {
  // 0deg = top, clockwise
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
};

const arcPath = (r: number, startDeg: number, endDeg: number) => {
  const start = polar(r, startDeg);
  const end = polar(r, endDeg);
  const sweep = endDeg > startDeg ? 1 : 1;
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} ${sweep} ${end.x} ${end.y}`;
};

/**
 * Build 7 arrows. Sectors are 60° each (between adjacent nodes).
 * 6 sectors get 1 arrow. The MORE CLIENTS → CLIENT TRACKS sector (300° → 360°)
 * gets 2 stacked arrows to make 7 total.
 */
type Arrow = { start: number; end: number };
const ARROWS: Arrow[] = (() => {
  const arr: Arrow[] = [];
  for (let i = 0; i < NODES.length; i++) {
    const a = NODES[i].angle;
    const b = NODES[(i + 1) % NODES.length].angle === 0 ? 360 : NODES[(i + 1) % NODES.length].angle;
    // single arrow that sits inside the sector with small gaps near nodes
    arr.push({ start: a + ARROW_GAP_DEG, end: b - ARROW_GAP_DEG });
  }
  // 7th arrow: a small additional arrow in the MORE CLIENTS (300) → CLIENT TRACKS (360) sector,
  // visually a tighter loop-back
  arr.push({ start: 320, end: 340 });
  return arr;
})();

export default function FlywheelSVG({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={className}
      role="img"
      aria-label="Vecto flywheel: client tracks, results come, client stays, refers friends, reputation grows, more clients, repeat"
    >
      <defs>
        <marker
          id="vecto-arrowhead"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--primary))" />
        </marker>
      </defs>

      {/* Arrows */}
      {ARROWS.map((a, i) => (
        <path
          key={i}
          d={arcPath(RING_R, a.start, a.end)}
          stroke="hsl(var(--primary))"
          strokeWidth={10}
          strokeLinecap="butt"
          fill="none"
          markerEnd="url(#vecto-arrowhead)"
        />
      ))}

      {/* Center wordmark — match SplashScreen styling */}
      <text
        x={CX}
        y={CY + 8}
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontWeight={700}
        fontSize={56}
        letterSpacing="-0.02em"
      >
        <tspan fill="hsl(var(--primary))">V</tspan>
        <tspan fill="hsl(var(--foreground))">ECTO</tspan>
      </text>

      {/* Nodes */}
      {NODES.map(({ key, label, Icon, angle }) => {
        const { x, y } = polar(NODE_R, angle);
        // label position: a bit further out radially from node
        const labelOffset = NODE_CIRCLE_R + 18;
        const labelPos = polar(NODE_R + labelOffset, angle);
        // text-anchor based on horizontal position
        const anchor =
          Math.abs(labelPos.x - CX) < 20 ? 'middle' : labelPos.x > CX ? 'start' : 'end';

        // Wrap label into max 2 lines on space
        const words = label.split(' ');
        const lines =
          words.length <= 1
            ? [label]
            : words.length === 2
            ? words
            : [words.slice(0, words.length - 1).join(' '), words[words.length - 1]];

        return (
          <g key={key}>
            {/* Icon circle */}
            <circle
              cx={x}
              cy={y}
              r={NODE_CIRCLE_R}
              fill="hsl(var(--background))"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
            />
            <foreignObject
              x={x - 14}
              y={y - 14}
              width={28}
              height={28}
              style={{ color: 'hsl(var(--primary))' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <Icon size={22} strokeWidth={2} />
              </div>
            </foreignObject>

            {/* Label */}
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontFamily="Inter, sans-serif"
              fontWeight={700}
              fontSize={14}
              letterSpacing="0.08em"
              fill="hsl(var(--foreground))"
            >
              {lines.map((ln, idx) => (
                <tspan
                  key={idx}
                  x={labelPos.x}
                  dy={idx === 0 ? `-${(lines.length - 1) * 0.55}em` : '1.1em'}
                >
                  {ln}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
