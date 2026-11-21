"use client";

import { memo, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { Marker } from "@/lib/map";
import { PixelTrain } from "@/components/shared/pixel-train";
import { cn } from "@/lib/utils";
import { categoryStyle } from "./category";
import { content, type CategoryId, type Landmark } from "./content";
import { PixelLandmark } from "./PixelLandmark";
import { verifiedText, type Verified } from "./verified";

/** Open problems at the landmark's stop. When set, the building itself is the mission marker. */
export type LandmarkProblems = { count: number; done: number; top: CategoryId; verified: Verified | null };

type Props = {
  landmark: Landmark;
  /** 0.5 to 1.4: models grow as the map zooms in. */
  scale: number;
  selected: boolean;
  problems?: LandmarkProblems;
  onSelect: (landmark: Landmark) => void;
};

const SPRING = { type: "spring", stiffness: 260, damping: 20 } as const;
// Pixel sparks around the building when it is picked: a small, quiet "reveal".
const SPARKS = [
  { x: -30, y: -70, d: 0.05 },
  { x: 34, y: -62, d: 0.12 },
  { x: -36, y: -28, d: 0.18 },
  { x: 38, y: -22, d: 0.1 },
];

/**
 * One miniature building floating just above the map, pinned to its real spot.
 * It hovers over a soft shadow, lifts a little on hover, and pops up when selected.
 * Each landmark uses its matching pixel sprite.
 * With `problems`, a small tag shows the count, and finishing one sends a pixel train past the building.
 */
export const LandmarkMarker = memo(function LandmarkMarker({ landmark, scale, selected, problems, onSelect }: Props) {
  const reduce = useReducedMotion() ?? false;
  const train = useTrainOnNewDone(problems?.done ?? 0);
  const style = problems ? categoryStyle[problems.top] : undefined;
  const allDone = problems ? problems.done >= problems.count : false;
  const verified = problems?.verified ?? null;
  const label = !problems
    ? landmark.name
    : verified
      ? content.verified.marker(landmark.name, verifiedText(verified))
      : content.landmarkProblems(landmark.name, problems.count, problems.done);

  return (
    <Marker longitude={landmark.longitude} latitude={landmark.latitude} anchor="bottom" style={{ zIndex: selected ? 6 : 5 }}>
      <motion.button
        type="button"
        aria-label={label}
        aria-pressed={selected}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(landmark);
        }}
        initial="rest"
        animate={selected ? "selected" : "rest"}
        whileHover={selected ? "selected" : "hover"}
        style={{ scale, transformOrigin: "bottom center" }}
        className="relative grid cursor-pointer justify-items-center outline-none focus-visible:ring-4 focus-visible:ring-graphite/30"
      >
        {/* The model: rises on hover, rises further and grows when selected. */}
        <motion.span
          className="relative z-10 block"
          variants={{
            rest: { y: -6, scale: 1 },
            hover: { y: -12, scale: 1.04 },
            selected: { y: -18, scale: 1.12 },
          }}
          transition={SPRING}
        >
          <PixelLandmark art={landmark.id} size={landmark.stationMarker ? 76 : 64} />

          {/* Problem tag on the roof: count in the most urgent category's colour, a check when all are done. */}
          {problems && style && (
            <span
              aria-hidden
              className={cn(
                "absolute top-[34%] right-0 grid size-6 place-items-center rounded-full font-pixel text-[0.5rem] text-ivory ring-2 ring-ivory shadow-float",
                verified ? "bg-cat-verify" : allDone ? "bg-taupe" : style.bg,
              )}
            >
              {verified || allDone ? <Check className="size-3.5" strokeWidth={3} /> : problems.count}
            </span>
          )}
        </motion.span>

        {/* Contact shadow: tighter and fainter the higher the model floats. */}
        <motion.span
          aria-hidden
          className="absolute bottom-0 h-3 w-16 rounded-[50%] bg-shade blur-[5px]"
          variants={{
            rest: { opacity: 0.5, scaleX: 1 },
            hover: { opacity: 0.38, scaleX: 0.9 },
            selected: { opacity: 0.28, scaleX: 0.78 },
          }}
          transition={SPRING}
        />

        {/* Reveal: a few pixel sparks pop once when the building is picked. */}
        <AnimatePresence>
          {selected &&
            !reduce &&
            SPARKS.map((spark) => (
              <motion.span
                key={`${spark.x}${spark.y}`}
                aria-hidden
                className="absolute bottom-0 left-1/2 z-20 size-1.5 bg-sun"
                initial={{ x: 0, y: -30, scale: 0, opacity: 0 }}
                animate={{ x: spark.x, y: spark.y, scale: [0, 1.4, 0], opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ delay: spark.d, duration: 0.55, ease: "easeOut" }}
              />
            ))}
        </AnimatePresence>

        {/* After a contribution here: a tiny pixel train runs past the building once. */}
        <AnimatePresence>
          {train > 0 && !reduce && (
            <motion.span
              key={train}
              aria-hidden
              className="absolute bottom-1 z-20"
              initial={{ x: -70, opacity: 0 }}
              animate={{ x: 70, opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            >
              <PixelTrain size={36} body={style?.fill} />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Name tab: only while selected, so the resting map stays uncluttered. */}
        <span
          className={cn(
            "absolute -bottom-5 rounded-sm border border-hairline bg-ivory px-1.5 py-0.5 font-mono text-[0.55rem] leading-none whitespace-nowrap text-graphite uppercase shadow-float transition-opacity duration-200",
            selected ? "opacity-100" : "opacity-0",
          )}
        >
          {landmark.name}
        </span>
      </motion.button>
    </Marker>
  );
});

/** Counts up each time `done` grows after the first load, so the train plays only for a fresh contribution. */
function useTrainOnNewDone(done: number) {
  const [plays, setPlays] = useState(0);
  const last = useRef<number | null>(null);
  useEffect(() => {
    if (last.current !== null && done > last.current) setPlays((n) => n + 1);
    last.current = done;
  }, [done]);
  return plays;
}
