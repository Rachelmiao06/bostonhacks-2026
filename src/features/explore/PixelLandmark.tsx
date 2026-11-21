import { cn } from "@/lib/utils";

// Cute pixel-art miniatures for the map, drawn from character grids (like the pixel train),
// so they stay crisp at any size and every colour is a theme token.
// PROTOTYPE: one building for now, to judge the look before drawing more.
//
// o outline   b brick front   s brick side (in shade)   w window   d door
// t tower     r roof          g gold                    . empty
const ART = {
  "old-state-house": [
    "..........g...........",
    ".........ggg..........",
    "..........o...........",
    ".........ooo..........",
    "........otwto.........",
    "........ottto.........",
    "........owwwo.........",
    ".......ootttoo........",
    ".......otwtwto........",
    "......ooooooooo.......",
    ".....orrrrrrrrro......",
    "....orrrrrrrrrrro.....",
    "...ooooooooooooooo....",
    "...obbbbbbbbbbbbbsso..",
    "...obwwbbwwbbwwbbsso..",
    "...obwwbbwwbbwwbbssso.",
    "...obbbbbbbbbbbbbssso.",
    "...obbbbbbbbbbbbbssso.",
    "...obwwbbwwbbwwbbssso.",
    "...obwwbbwwbbwwbbssso.",
    "...obbbbbbbbbbbbbssso.",
    "...obbbbbbddbbbbbssso.",
    "...obbbbbbddbbbbbssso.",
    "...oooooooooooooooooo.",
  ],
} as const;

export type PixelArtId = keyof typeof ART;

const FILL: Record<string, string> = {
  o: "fill-graphite",
  b: "fill-cat-service",
  s: "fill-cat-service opacity-70",
  w: "fill-ivory",
  d: "fill-graphite",
  t: "fill-ivory",
  r: "fill-stone-deep",
  g: "fill-sun",
};

type Props = {
  art: PixelArtId;
  /** Width in px; height follows the grid. */
  size?: number;
  className?: string;
};

export function PixelLandmark({ art, size = 72, className }: Props) {
  const rows = ART[art];
  const w = Math.max(...rows.map((row) => row.length));
  const h = rows.length;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={size}
      height={(size * h) / w}
      shapeRendering="crispEdges"
      aria-hidden
      className={cn("block shrink-0", className)}
    >
      {rows.flatMap((row, y) =>
        [...row].map((char, x) =>
          char === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} className={FILL[char]} />,
        ),
      )}
    </svg>
  );
}
