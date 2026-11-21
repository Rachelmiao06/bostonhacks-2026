"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { Marker } from "@/lib/map";
import { cn } from "@/lib/utils";
import { LandmarkMarker } from "./LandmarkMarker";
import { landmarks, type LandmarkId } from "@/features/landmarks/catalog";
import type { SubwayStation } from "./types";

/**
 * Every subway stop, kept quiet so the problems stand out:
 * - "stop": a small ring in its line colour.
 * - "hub": a transfer station, a slightly larger ring.
 * Stops with open problems also get a ProblemPin above them.
 */
export type StationKind = "stop" | "hub";

type Props = {
  landmark?: LandmarkId;
  spriteSize: number;
  station: SubwayStation;
  kind: StationKind;
  /** The station's line colour, straight from the MBTA. */
  color: string;
  selected: boolean;
  /** Small dots shrink when the map is zoomed far out. */
  compact: boolean;
  onSelect: (station: SubwayStation) => void;
};

const SPRING = { type: "spring", stiffness: 380, damping: 22 } as const;

export const StationMarker = memo(function StationMarker({ station, kind, color, selected, compact, landmark, spriteSize, onSelect }: Props) {
  return (
    <Marker longitude={station.longitude} latitude={station.latitude} anchor="center" style={{ zIndex: selected ? 3 : 1 }}>
      <motion.button
        type="button"
        aria-label={landmark ? `${station.name}, ${landmarks[landmark].label}` : station.name}
        aria-pressed={selected}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(station);
        }}
        animate={{ scale: selected && !landmark ? 1.3 : 1 }}
        whileHover={landmark ? undefined : { scale: selected ? 1.3 : 1.15 }}
        whileTap={{ scale: 0.94 }}
        transition={SPRING}
        className="relative grid cursor-pointer place-items-center rounded-full p-1.5 outline-none focus-visible:ring-4 focus-visible:ring-graphite/30"
      >
        {landmark && <LandmarkMarker id={landmark} size={spriteSize} />}
        <span
          // The ring is the line's colour (from the MBTA API, not typed in).
          style={{ borderColor: color }}
          className={cn(
            "thread-eyelet block rounded-full bg-ivory",
            kind === "hub" ? "size-3.5 border-[3px] ring-2 ring-ivory" : "border-2",
            kind === "stop" && (compact ? "size-1.5" : "size-2.5"),
            selected && "ring-2 ring-graphite",
          )}
        />
      </motion.button>
    </Marker>
  );
});
