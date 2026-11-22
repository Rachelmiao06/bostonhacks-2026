import { cn } from "@/lib/utils";
import { unlockSteps } from "@/features/island/content";
import { PixelIcon } from "./PixelIcon";

// The island's 12 pieces as small coloured pixel sprites, in the SAME order as the island's journey (`unlockSteps`).
// Letters map to design-token fills. Sprites are drawings only: what is unlocked always comes from the server's count.
const FILL = {
  G: "fill-leaf", V: "fill-cat-verify", Y: "fill-sun", R: "fill-cherry", W: "fill-wood",
  B: "fill-sky", I: "fill-ivory", S: "fill-steel", T: "fill-taupe",
} as const;

const SPRITES: string[][] = [
  // grass & flowers
  ["..R....Y..", ".RYR..YRY.", "..R....Y..", "..G....G..", ".VG..G.VG.", ".VGG.GGVG.", "GGGGGGGGGG", "VVVVVVVVVV"],
  // round tree
  ["...GGGG...", "..GGGGGG..", ".GGGVGGGG.", ".GGGGGGVG.", ".GVGGGGGG.", "..GGGGGG..", "....WW....", "....WW....", "...WWWW..."],
  // pines
  ["..G....G..", ".GGG..GGG.", "..G....G..", ".GGG..GGG.", "GGGGG.GGGG", "..W....W..", "..W....W.."],
  // stones
  ["...SSS....", "..SSSSS.SS", ".SISSSSSSS", "SSSSSSTSSS", "TTTTTTTTTT"],
  // cottage
  ["....RR....", "...RRRR...", "..RRRRRR..", ".RRRRRRRR.", "..IIIIII..", "..IBIIBI..", "..IIWWII..", "..IIWWII.."],
  // garden & fence
  ["..R..Y..R.", "..G..G..G.", "WWWWWWWWWW", "W.W.W.W.W.", "WWWWWWWWWW", "W.W.W.W.W."],
  // sheep
  ["...III...T", ".IIIIIII.T", "IIIIIIIITT", "IIIIIIIIT.", ".IIIIIII..", "..T.T.T.T.", "..T.T.T.T."],
  // more trees and flowers
  ["..GGG..R..", ".GGGGG.YR.", ".GGGVG..G.", "..GGG...G.", "...W....V.", "...W..GGGG", "GGGGGGGGGG"],
  // flock
  [".II..II...", "IIII.IIII.", "IIIIIIIIII", ".T.T.T.T..", ".T.T.T.T.."],
  // bridge
  [".WWWWWWWW.", "WWWWWWWWWW", "W.W.WW.W.W", "BBBBBBBBBB", "BBBIBBBIBB"],
  // pinwheel
  ["..R..B....", ".RRR.BBB..", "..RRBBBB..", "...YY.....", ".BBBYYRR..", "..BBB.RRR.", "....W..R..", "....W.....", "....W....."],
  // clouds
  ["...III....", "..IIIIII..", ".IIIIIIIII", "IIIIIIIIII", ".SSSSSSSS."],
];

export const PIECES = unlockSteps.length;

/** One sprite, drawn bottom-aligned in a 10x10 grid. Locked pieces are a soft silhouette. */
export function Sprite({ index, locked, className }: { index: number; locked?: boolean; className?: string }) {
  const rows = SPRITES[index] ?? [];
  const top = 10 - rows.length;
  return (
    <svg aria-hidden viewBox="0 0 10 10" shapeRendering="crispEdges" className={cn("size-10", className)}>
      {rows.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === "." ? null : <rect key={`${x}-${y}`} x={x} y={top + y} width={1} height={1} className={locked ? "fill-graphite/15" : FILL[c as keyof typeof FILL]} />,
        ),
      )}
    </svg>
  );
}

/**
 * My Little World, in small: the 12 pieces (unlocked in colour, the rest a silhouette), the one that was just
 * unlocked floating with a sparkle, and a segmented bar. `known` is the server-confirmed count; nothing is counted here.
 */
export function WorldPreview({ known, justUnlocked }: { known: number; justUnlocked: boolean }) {
  const count = Math.min(known, PIECES);
  const newest = justUnlocked && count > 0 ? count - 1 : -1;
  const next = count < PIECES ? unlockSteps[count] : null;
  return (
    <div className="space-y-3 rounded-2xl border border-graphite/12 bg-ivory/70 p-4">
      {newest >= 0 && (
        <div className="flex items-center gap-3" role="status">
          <span className="relative grid size-20 shrink-0 place-items-center rounded-2xl bg-sun/15">
            <Sprite index={newest} className="size-14 motion-safe:animate-float" />
            <PixelIcon name="spark" className="absolute -top-1 -right-1 size-5 text-sun" />
            <PixelIcon name="spark" className="absolute bottom-1 -left-1 size-3 text-sun" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-taupe uppercase">New for your little world</p>
            <p className="text-base font-semibold text-graphite">{unlockSteps[newest].label}</p>
            <p className="text-sm leading-snug text-taupe">{unlockSteps[newest].blurb}</p>
          </div>
        </div>
      )}
      <ul aria-label="Pieces of your little world" className="grid grid-cols-6 gap-1.5">
        {unlockSteps.map((step, i) => (
          <li
            key={step.label}
            title={i < count ? step.label : "Not unlocked yet"}
            className={cn("grid aspect-square place-items-center rounded-xl", i < count ? "bg-ivory shadow-float" : "bg-graphite/5", i === newest && "ring-2 ring-sun")}
          >
            <Sprite index={i} locked={i >= count} className="size-8" />
            <span className="sr-only">{i < count ? `${step.label}, unlocked` : "Locked"}</span>
          </li>
        ))}
      </ul>
      <div>
        <div role="progressbar" aria-label="Pieces unlocked" aria-valuemin={0} aria-valuemax={PIECES} aria-valuenow={count} className="flex gap-0.5">
          {unlockSteps.map((s, i) => (
            <span key={s.label} className={cn("h-2 flex-1 rounded-[2px]", i < count ? "bg-cat-verify" : "bg-graphite/12")} />
          ))}
        </div>
        <p className="mt-1.5 text-sm text-taupe">
          {count} of {PIECES} pieces
          {next ? ` · Next: ${next.label}, after 1 more mission` : " · Your little world is complete for now"}
        </p>
      </div>
    </div>
  );
}
