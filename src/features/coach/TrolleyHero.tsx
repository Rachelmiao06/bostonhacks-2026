// The small hero at the top of the intro card: a compact voxel trolley in 3/4 view, floating above a transit line
// that draws itself, with four coloured station dots that light up one after another as a soft light passes.
// Plain SVG and CSS: no images, no animation library, no 3D scene. Every colour is a theme token.
// Reduced Motion shows one still frame: the line drawn, the dots lit, the trolley at rest.

const U = 3; // one voxel, in drawing units
const OX = 146.5; // where the trolley's back corner sits
const OY = 37;
/** 2:1 isometric projection: x runs to the lower right, y to the lower left, z is up. */
const p = (x: number, y: number, z: number) => `${(OX + (x - y) * U).toFixed(1)},${(OY + ((x + y) * U) / 2 - z * U).toFixed(1)}`;
const poly = (...pts: [number, number, number][]) => pts.map(([x, y, z]) => p(x, y, z)).join(" ");

type Tone = { top: string; long: string; end: string };

/** A box with its three visible faces: the top, the long side (facing lower left) and the short end (facing lower right). */
function Box({ x, y, z, w, d, h, tone, outline }: { x: number; y: number; z: number; w: number; d: number; h: number; tone: Tone; outline?: boolean }) {
  const t = z + h;
  if (outline) {
    // The dark silhouette line of the map's pixel icons: all three faces, thick stroke, drawn behind the colours.
    const pts = [poly([x, y, t], [x + w, y, t], [x + w, y + d, t], [x, y + d, t]), poly([x, y + d, z], [x + w, y + d, z], [x + w, y + d, t], [x, y + d, t]), poly([x + w, y, z], [x + w, y + d, z], [x + w, y + d, t], [x + w, y, t])];
    return (
      <>
        {pts.map((points) => (
          <polygon key={points} points={points} fill="var(--hero-ink)" stroke="var(--hero-ink)" strokeWidth="2.6" strokeLinejoin="round" />
        ))}
      </>
    );
  }
  return (
    <>
      <polygon points={poly([x, y, t], [x + w, y, t], [x + w, y + d, t], [x, y + d, t])} fill={tone.top} />
      <polygon points={poly([x, y + d, z], [x + w, y + d, z], [x + w, y + d, t], [x, y + d, t])} fill={tone.long} />
      <polygon points={poly([x + w, y, z], [x + w, y + d, z], [x + w, y + d, t], [x + w, y, t])} fill={tone.end} />
    </>
  );
}

const L = 14; // trolley length
const W = 5; // width
const BODY_Z = 1.9;
const BODY_H = 3.4;
const ROOF_Z = BODY_Z + BODY_H;

// The line is hand-drawn and a little irregular, like a doodle: a smooth curve through these knots (viewBox units).
// The four stations sit on knots, so they are exactly on the line, each carrying a problem colour.
const KNOTS: [number, number][] = [[16, 82], [56, 72], [96, 86], [128, 76], [168, 87], [200, 74], [236, 87], [264, 76], [304, 84]];
const STATION_AT = [1, 3, 5, 7];
const STATION_COLORS = ["var(--cat-service)", "var(--cat-access)", "var(--cat-station)", "var(--cat-verify)"];

/** A smooth curve through every knot (Catmull-Rom turned into cubic Béziers). */
const LINE_D = KNOTS.map(([x, y], i) => {
  if (i === 0) return `M${x} ${y}`;
  const p0 = KNOTS[Math.max(i - 2, 0)];
  const p1 = KNOTS[i - 1];
  const p3 = KNOTS[Math.min(i + 1, KNOTS.length - 1)];
  const c1 = [p1[0] + (x - p0[0]) / 6, p1[1] + (y - p0[1]) / 6];
  const c2 = [x - (p3[0] - p1[0]) / 6, y - (p3[1] - p1[1]) / 6];
  return `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${x} ${y}`;
}).join(" ");

const CYCLE = 9; // seconds for one pass of the light
const START = 2.6; // the line draws for ~2.2s, then the light starts
const TRAVEL = 1.28; // the light's head travels 1.28 line lengths per cycle (it starts and ends off the line)
const lengths = KNOTS.slice(1).map(([x, y], i) => Math.hypot(x - KNOTS[i][0], y - KNOTS[i][1]));
const total = lengths.reduce((a, b) => a + b, 0);
const stations = STATION_AT.map((k, i) => {
  const frac = lengths.slice(0, k).reduce((a, b) => a + b, 0) / total;
  return { x: KNOTS[k][0], y: KNOTS[k][1], color: STATION_COLORS[i], frac, litAt: START + (frac * CYCLE) / TRAVEL };
});

const css = `
.coach-hero {
  --hero-green: var(--cat-verify);
  --hero-green-top: color-mix(in oklab, var(--cat-verify) 62%, var(--ivory));
  --hero-green-side: color-mix(in oklab, var(--cat-verify) 78%, var(--graphite));
  --hero-green-end: color-mix(in oklab, var(--cat-verify) 58%, var(--graphite));
  --hero-roof-top: var(--ivory);
  --hero-roof-long: color-mix(in oklab, var(--ivory) 86%, var(--graphite));
  --hero-roof-end: color-mix(in oklab, var(--ivory) 70%, var(--graphite));
  --hero-ink: color-mix(in oklab, var(--graphite) 92%, var(--cat-verify));
  --hero-dark: color-mix(in oklab, var(--graphite) 88%, var(--ivory));
  --hero-glass: color-mix(in oklab, var(--ivory) 94%, var(--cat-verify));
}
.coach-hero .float { transform-box: fill-box; transform-origin: 50% 60%; animation: coach-float 6s ease-in-out infinite; }
.coach-hero .shadow { transform-box: fill-box; transform-origin: 50% 50%; animation: coach-shadow 6s ease-in-out infinite; }
.coach-hero .draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: coach-draw 2.2s cubic-bezier(.45,0,.25,1) forwards; }
.coach-hero .pulse { opacity: 0; stroke-dasharray: .14 5; animation: coach-sweep ${CYCLE}s linear ${START}s infinite backwards, coach-show .8s ease ${START}s forwards; }
.coach-hero .station { opacity: 0; animation: coach-in .6s ease forwards; }
.coach-hero .dot { opacity: .35; animation: coach-dot ${CYCLE}s ease-in-out infinite; }
.coach-hero .ring { opacity: 0; transform-box: fill-box; transform-origin: 50% 50%; animation: coach-ring ${CYCLE}s ease-out infinite; }
@keyframes coach-float { 0%, 100% { transform: translateY(0) rotate(-.9deg); } 50% { transform: translateY(-3px) rotate(.9deg); } }
@keyframes coach-shadow { 0%, 100% { transform: scaleX(1); opacity: .16; } 50% { transform: scaleX(.88); opacity: .1; } }
@keyframes coach-draw { to { stroke-dashoffset: 0; } }
@keyframes coach-sweep { from { stroke-dashoffset: .14; } to { stroke-dashoffset: -1.14; } }
@keyframes coach-show { to { opacity: .95; } }
@keyframes coach-in { to { opacity: 1; } }
@keyframes coach-dot { 0% { opacity: .35; } 5% { opacity: 1; } 24% { opacity: 1; } 48%, 100% { opacity: .35; } }
@keyframes coach-ring { 0% { opacity: .55; transform: scale(.8); } 30% { opacity: 0; transform: scale(1.7); } 100% { opacity: 0; transform: scale(1.7); } }
@media (prefers-reduced-motion: reduce) {
  .coach-hero .float, .coach-hero .shadow, .coach-hero .pulse, .coach-hero .ring, .coach-hero .dot { animation: none; }
  .coach-hero .draw { animation: none; stroke-dashoffset: 0; }
  .coach-hero .station { animation: none; opacity: 1; }
  .coach-hero .dot { opacity: 1; }
}
`;

const greenTone: Tone = { top: "var(--hero-green-top)", long: "var(--hero-green)", end: "var(--hero-green-end)" };
const roofTone: Tone = { top: "var(--hero-roof-top)", long: "var(--hero-roof-long)", end: "var(--hero-roof-end)" };
const darkTone: Tone = { top: "var(--hero-dark)", long: "var(--hero-dark)", end: "color-mix(in oklab, var(--graphite) 96%, var(--ivory))" };

export function TrolleyHero() {
  return (
    <svg
      viewBox="0 0 320 96"
      role="img"
      aria-label="A small pixel trolley floating above a transit line"
      shapeRendering="crispEdges"
      className="coach-hero h-24 w-full rounded-2xl bg-stone"
    >
      <style>{css}</style>

      {/* the line: a faint track, the green line that draws itself, and a soft light that passes along it */}
      <path d={LINE_D} fill="none" stroke="var(--graphite)" strokeOpacity=".12" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path className="draw" d={LINE_D} pathLength={1} fill="none" stroke="var(--cat-verify)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path className="pulse" d={LINE_D} pathLength={1} fill="none" stroke="var(--ivory)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />

      {stations.map((s, i) => (
        <g key={s.x} className="station" style={{ animationDelay: `${(s.frac * 2.1).toFixed(2)}s` }}>
          <circle cx={s.x} cy={s.y} r="7" fill="var(--ivory)" stroke="var(--graphite)" strokeOpacity=".2" strokeWidth="1" />
          <circle className="ring" cx={s.x} cy={s.y} r="8" fill="none" stroke={s.color} strokeWidth="1.5" style={{ animationDelay: `${s.litAt.toFixed(2)}s` }} />
          <circle className="dot" cx={s.x} cy={s.y} r="3.8" fill={s.color} style={{ animationDelay: `${s.litAt.toFixed(2)}s` }} data-i={i} />
        </g>
      ))}

      {/* soft contact shadow on the line, breathing against the bob */}
      <ellipse className="shadow" cx="160" cy="79" rx="29" ry="3.2" fill="var(--graphite)" />

      {/* the trolley: chassis, wheels, green body, cream roof, windows, pantograph */}
      <g className="float">
        {[true, false].map((outline) => (
          <g key={String(outline)}>
            <Box x={0.7} y={0.7} z={0.9} w={L - 1.4} d={W - 1.4} h={1} tone={darkTone} outline={outline} />
            {[2.2, 6.6, 11].map((x) => (
              <Box key={x} x={x} y={W - 1.3} z={0} w={1.6} d={0.6} h={1.3} tone={darkTone} outline={outline} />
            ))}
            <Box x={0} y={0} z={BODY_Z} w={L} d={W} h={BODY_H} tone={greenTone} outline={outline} />
            <Box x={0.3} y={0.3} z={ROOF_Z} w={L - 0.6} d={W - 0.6} h={0.8} tone={roofTone} outline={outline} />
          </g>
        ))}

        {/* side windows and a cream stripe on the long face (y = W) */}
        {[0, 1, 2, 3, 4].map((k) => {
          const x0 = 1.1 + k * 2.5;
          return <polygon key={k} points={poly([x0, W, BODY_Z + 1.5], [x0 + 1.7, W, BODY_Z + 1.5], [x0 + 1.7, W, BODY_Z + 2.9], [x0, W, BODY_Z + 2.9])} fill="var(--hero-glass)" />;
        })}
        <polygon points={poly([0, W, BODY_Z + 0.55], [L, W, BODY_Z + 0.55], [L, W, BODY_Z + 0.95], [0, W, BODY_Z + 0.95])} fill="var(--hero-glass)" fillOpacity=".7" />

        {/* front: a wide window and one small headlight on the short end (x = L) */}
        <polygon points={poly([L, 0.9, BODY_Z + 1.4], [L, W - 0.9, BODY_Z + 1.4], [L, W - 0.9, BODY_Z + 2.9], [L, 0.9, BODY_Z + 2.9])} fill="var(--hero-glass)" fillOpacity=".92" />
        <polygon points={poly([L, 1.2, BODY_Z + 0.35], [L, 2, BODY_Z + 0.35], [L, 2, BODY_Z + 0.95], [L, 1.2, BODY_Z + 0.95])} fill="var(--ivory)" />

        {/* pantograph: a thin arm rising from the roof and a short contact bar */}
        <polyline points={`${p(5, W / 2, ROOF_Z + 0.8)} ${p(6.6, W / 2, ROOF_Z + 2.8)} ${p(8.2, W / 2, ROOF_Z + 0.8)}`} fill="none" stroke="var(--hero-dark)" strokeWidth="1.1" strokeLinejoin="round" />
        <line x1={p(5.9, W / 2 - 1.4, ROOF_Z + 2.8).split(",")[0]} y1={p(5.9, W / 2 - 1.4, ROOF_Z + 2.8).split(",")[1]} x2={p(7.5, W / 2 + 1.4, ROOF_Z + 2.8).split(",")[0]} y2={p(7.5, W / 2 + 1.4, ROOF_Z + 2.8).split(",")[1]} stroke="var(--hero-dark)" strokeWidth="1.3" strokeLinecap="round" />
      </g>
    </svg>
  );
}
