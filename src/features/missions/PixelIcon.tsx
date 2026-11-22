import { cn } from "@/lib/utils";

// Tiny 8x8 pixel icons. They are badges only: a whole screen is never drawn in pixels.
const SPRITES = {
  elevator: ["########", "#.#..#.#", "#.#..#.#", "#.#..#.#", "#.#..#.#", "#.#..#.#", "#.#..#.#", "########"],
  check: ["........", ".......#", "......##", "#....##.", "##..##..", ".####...", "..##....", "........"],
  barrier: ["........", "########", "#.#.#.#.", "########", ".#....#.", ".#....#.", ".#....#.", "........"],
  question: ["..####..", ".##..##.", "....##..", "...##...", "...##...", "........", "...##...", "........"],
  train: [".######.", "#......#", "#.####.#", "#......#", "########", "#.#..#.#", ".######.", "..#..#.."],
  spark: ["...#....", "...#....", "..###...", "#######.", "..###...", "...#....", "...#....", "........"],
} as const;

export type PixelName = keyof typeof SPRITES;

/** Coloured with the surrounding text colour, so it follows the design tokens. */
export function PixelIcon({ name, className }: { name: PixelName; className?: string }) {
  const rows = SPRITES[name];
  return (
    <svg aria-hidden viewBox="0 0 8 8" shapeRendering="crispEdges" className={cn("size-6 shrink-0 fill-current", className)}>
      {rows.flatMap((row, y) =>
        [...row].map((cell, x) => (cell === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null)),
      )}
    </svg>
  );
}
