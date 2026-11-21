import { cn } from "@/lib/utils";

// A tiny pixel-art T car, drawn from a character grid so it stays crisp at any size.
// o = outline, w = window, b = body (takes the `body` class), l = headlight. Colours are theme tokens.
const ROWS = [
  "...oooooooooooo..",
  "..owwowwowwowwwo.",
  "..owwowwowwowwwo.",
  "..oooooooooooooo.",
  "..obbbbbbbbbbbbol",
  "..obbbbbbbbbbbbo.",
  "..oooooooooooooo.",
  "....oo..oo..oo...",
];

const FILL: Record<string, string> = {
  o: "fill-graphite",
  w: "fill-ivory",
  l: "fill-sun",
};

type Props = {
  /** Width in px; height follows the grid. */
  size?: number;
  /** Tailwind fill class for the body, e.g. "fill-cat-service". */
  body?: string;
  className?: string;
  title?: string;
};

export function PixelTrain({ size = 34, body = "fill-cat-service", className, title }: Props) {
  const w = ROWS[0].length;
  const h = ROWS.length;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={size}
      height={(size * h) / w}
      shapeRendering="crispEdges"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn("shrink-0", className)}
    >
      {ROWS.flatMap((row, y) =>
        [...row].map((char, x) =>
          char === "." ? null : (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} className={char === "b" ? body : FILL[char]} />
          ),
        ),
      )}
    </svg>
  );
}
