import { cn } from "@/lib/utils";

// Cute pixel-art miniatures for the map, drawn from character grids (like the pixel train),
// so they stay crisp at any size and every colour is a theme token.
// p rose brick, c shaded masonry, m mint, v dark green, l blue glass.
//
// o outline   w window   d door
// t tower     r roof          g gold                    . empty
const ART = {
  "old-state-house": [
    ".........gg.............",
    "........ggog............",
    "..........o.............",
    ".........ooo............",
    "........omvvo...........",
    ".......owwwwwo..........",
    ".......owldwro..........",
    ".......owldwro..........",
    "......oowwwwwroo........",
    ".......owwdwro..........",
    ".......owddwro..........",
    ".....ooowwwwrooooo......",
    "....ommmowwoommmmvo.....",
    "...ommmowppwommmmmvo....",
    "..oommowppppwommmmvvo...",
    "..owwowppwwppwowwwwwwo..",
    "..opppppwddwppppocccco..",
    "..opwlppwllwppwlocdlco..",
    "..opwwppwwwwppwwocwlco..",
    "..oppppowwwwopppocccco..",
    "..owwwwowwwwowwworrrro..",
    "..opwlppodwoppwlocdlco..",
    "..opwwppoddoppwwocwlco..",
    "..opppppoddoppppocccco..",
    "..owwwwwrrrrwwwworrrro..",
    "..oooooooooooooooooooo..",
  ],
  "state-house": [
    ".............g.............",
    "............ogo............",
    "............owo............",
    "..........oogggoo.........",
    ".........ogwwgggggo........",
    "........ogwwgggggggo.......",
    "........oggggggggggo.......",
    ".......oooooooooooooo......",
    ".......owtwttwttwtwto......",
    "..oooooooooooooooooooooo...",
    ".oppppppppoottooopppppppo..",
    ".opddpppoottwwttooppddppo..",
    ".opwwpoottwwwwwwttoopwwpo..",
    ".opppoooooooooooooooppppo..",
    ".opddpwtotwtotwtotwpddppo..",
    ".opwwpwtotwtotwtotwpwwppo..",
    ".oppppwtotwtotwtotwpppppo..",
    ".oooooowwwwwwwwwwwooooooo..",
    "......orrrrrrrrrrrro.......",
    ".....oooooooooooooooo......",
  ],
  "fenway-park": [
    "....o.........o............",
    "....wg........wg...........",
    "...ooooooooooooooooo.......",
    "...ovvvvvvvvvvvvvvvvoo.....",
    "...ovmmvvvvvvvvmvvvvovo....",
    "..oovvvvvvvvvvvvvvvvovoo...",
    ".opooooooooooooooooooovvo..",
    "opppommmmmmmmmmmmmmmoovvvo.",
    "oppommmmmmmmmmmmmoooocccco.",
    "oppommmmmmmmccccommmmoccoo.",
    "oppommmmmcccttttccmmmmoco..",
    ".oppommmccttmmtttccmmooco..",
    "..oppommmccttmmttccmoccco..",
    "...oppommmccttttccmocccoo..",
    "....oppommmccwwccmocccoo...",
    ".....oppommmcwccmocccoo....",
    "......oppommmwmoccccoo.....",
    ".......oppoooooccccoo......",
    "........opppppccccoo.......",
    ".........oooooooooo........",
  ],
  "public-library": [
    "....ooooooooooooooooooo....",
    "...ommrmmrmmrmmrmmrmmroo...",
    "..ommmmmmmmmmmmmmmmmmorro..",
    ".oooooooooooooooooooooocco.",
    ".owwwwwwwwwwwwwwwwwwwoccco.",
    ".ottdtttdtttdtttdtttdocdco.",
    ".otdldtdldtdldtdldtdlocdco.",
    ".otdldtdldtdldtdldtdloccco.",
    ".owwwwwwwwwwwwwwwwwwwoccco.",
    ".ottttttoottoottootttoccco.",
    ".ottdttoddooddooddotttocdco.",
    ".otdldtoddooddooddotdocdco.",
    ".otdldtoddooddooddotdoccco.",
    ".oooooowwwwwwwwwwwooooooo..",
    ".....orrrrrrrrrrrrro.......",
    "....ooooooooooooooooo......",
  ],
  "south-station": [
    ".............o.............",
    "............owo............",
    "..........oowwwoo..........",
    ".........opwwdwwpo.........",
    ".........opwddwwpo.........",
    "........oopwwwwpooo........",
    "...ooooorppooooopprooooo...",
    "..ommmmmppppppppppmmmmmmo..",
    ".ooooooowwwwwwwwwwoooooooo.",
    ".opdwdwppdwdwdwdwppdwdwpoo.",
    ".opdwdwppdwdwdwdwppdwdwpco.",
    ".opppppppppppppppppppppco.",
    ".owwwwwwwwooooowwwwwwwwco.",
    ".opddpddpotllltopddpddpco.",
    ".opllpllopllwllpollpllpco.",
    ".opllpllopllwllpollpllpco.",
    ".oooooooorrrrrroooooooooo.",
    ".......oooooooooo.........",
  ],
  "tea-party-ships": [
    "..........oggg.............",
    "..........o........oggg....",
    ".......ooooooo.....o.......",
    ".......owwwwro..ooooooo....",
    "......owwwwwro..owwwwro....",
    "......oooooooo.owwwwwro....",
    "..........o....oooooooo....",
    ".....oooooooooo....o.......",
    ".....owwwwwwrro.oooooooo...",
    "....owwwwwwwrro.owwwwrro...",
    "....oooooooooooowwwwwrro...",
    "..........o....ooooooooo..o",
    ".ooo......o........o....oo.",
    ".oppoo....o..oggo..o..oo...",
    ".opppoooooooooooooooooo....",
    "..occcppppppppppppppco.....",
    "...occccgcccgcccgccco......",
    "....occcccccccccccoo.......",
    ".....ooooooooooooo.........",
    "...llmmmlll..lllmmmlll.....",
  ],
  "td-garden": [
    ".......ooooooooooo.........",
    ".....oorrrrrrrrrrrooo......",
    "...oowwwwwwwwwwwwwrrroo....",
    "..owwwwwwwwwwwwwwwwwrrroo..",
    ".ooooooooooooooooooooorcco.",
    ".otttttttttttttttttttorcco.",
    ".otvvvvtvvvvvvvvvvvvvovcco.",
    ".otvvvvtvvvvvvvvvvvvvovcco.",
    ".ogggggggggggggggggggogcco.",
    ".oooommmmmmmmmmmmooooovcco.",
    ".olllommmmmmmmmmollldovcco.",
    ".olllottttmtmtmmollllovcco.",
    ".olllommtmmtmmtmollllovcco.",
    ".olllommtmmtmmtmollllovcco.",
    ".olllommtmmtmtmmollllovcco.",
    ".ooodoooooooooooooodooooo..",
    "..owwllllwllllwllllwwooo...",
    "...ooooooooooooooooooo.....",
  ],
} as const;

export type PixelArtId = keyof typeof ART;

const FILL: Record<string, string> = {
  p: "fill-[var(--landmark-brick,#dc988d)]",
  c: "fill-[var(--landmark-masonry-shadow,#ac827e)]",
  m: "fill-[var(--landmark-mint,#a1d1b5)]",
  v: "fill-[var(--landmark-green,#426b5b)]",
  l: "fill-[var(--landmark-glass,#9bbfc9)]",
  o: "fill-graphite",
  w: "fill-ivory",
  d: "fill-graphite",
  t: "fill-ivory",
  r: "fill-stone-deep",
  g: "fill-sun",
};

// Combine adjacent pixels of one colour into SVG paths so map zooms need few DOM nodes.
function pixelPaths(rows: readonly string[]) {
  const paths = new Map<string, string>();
  rows.forEach((row, y) => {
    for (const run of row.matchAll(/([a-z])\1*/g)) {
      const colour = run[1];
      const length = run[0].length;
      paths.set(colour, (paths.get(colour) ?? "") + `M${run.index} ${y}h${length}v1h-${length}z`);
    }
  });
  return Array.from(paths);
}

const sprites = new Map(Object.entries(ART).map(([id, rows]) => [
  id, { width: Math.max(...rows.map(row => row.length)), height: rows.length, paths: pixelPaths(rows) },
]));

export const landmarkWidth = { station: 84, scenic: 70 } as const;

export function landmarkHeight(art: PixelArtId, width: number) {
  const sprite = sprites.get(art)!;
  return width * sprite.height / sprite.width;
}

type Props = {
  art: PixelArtId;
  /** Width in px; height follows the grid. */
  size?: number;
  className?: string;
};

export function PixelLandmark({ art, size = 72, className }: Props) {
  const { width: w, height: h, paths } = sprites.get(art)!;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={size}
      height={landmarkHeight(art, size)}
      shapeRendering="crispEdges"
      aria-hidden
      className={cn("block shrink-0", className)}
    >
      {paths.map(([colour, d]) => <path key={colour} d={d} className={FILL[colour]} />)}
    </svg>
  );
}
