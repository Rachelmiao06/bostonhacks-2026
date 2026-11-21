"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { Check, Ticket } from "lucide-react";
import { Marker } from "@/lib/map";
import { cn } from "@/lib/utils";
import { content } from "./content";
import type { SubwayStation } from "./types";

/**
 * How loud a station is on the map:
 * - "stop": an ordinary stop, a small quiet dot on its line.
 * - "hub": a transfer station, a slightly larger ringed dot.
 * - "mission": a station with something to do right now, a ticket stamp standing just above the line.
 */
export type StationKind = "stop" | "hub" | "mission";

type Props = {
  station: SubwayStation;
  kind: StationKind;
  /** The station's line colour, straight from the MBTA. */
  color: string;
  completed: boolean;
  selected: boolean;
  /** True when the MBTA reports an elevator out at this station. */
  outage: boolean;
  /** Small dots shrink when the map is zoomed far out. */
  compact: boolean;
  onSelect: (station: SubwayStation) => void;
};

const SPRING = { type: "spring", stiffness: 380, damping: 22 } as const;

export const StationMarker = memo(function StationMarker({
  station,
  kind,
  color,
  completed,
  selected,
  outage,
  compact,
  onSelect,
}: Props) {
  const label = `${station.name}${completed ? ", completed" : ""}${outage ? `, ${content.outageBadge}` : ""}`;
  const isMission = kind === "mission";

  return (
    <Marker
      longitude={station.longitude}
      latitude={station.latitude}
      // Dots sit on the line. Mission stamps stand just above it, so the line stays visible.
      anchor={isMission ? "bottom" : "center"}
      offset={isMission ? [0, -4] : [0, 0]}
      style={{ zIndex: selected ? 3 : isMission ? 2 : 1 }}
    >
      <motion.button
        type="button"
        aria-label={label}
        aria-pressed={selected}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(station);
        }}
        // Still by default. A small lift on hover, a clearer one when selected.
        animate={{ y: selected ? -4 : 0, scale: selected ? 1.25 : 1 }}
        whileHover={{ y: selected ? -4 : -2, scale: selected ? 1.25 : 1.12 }}
        whileTap={{ scale: 0.94 }}
        transition={SPRING}
        className="grid cursor-pointer place-items-center rounded-full p-1.5 outline-none focus-visible:ring-4 focus-visible:ring-ring/60"
      >
        {isMission ? (
          <span
            className={cn(
              "grid -rotate-6 place-items-center rounded-full border-2 border-dashed bg-paper shadow-[0_4px_8px_-2px_var(--shade)]",
              // Zoomed far out, stamps shrink to a small ringed dot so they do not pile up.
              compact ? "size-3 [&>svg]:hidden" : "size-7",
              completed ? "border-leaf text-leaf" : "border-cherry text-cherry",
            )}
          >
            {completed ? <Check className="size-3.5" strokeWidth={3} /> : <Ticket className="size-3.5" />}
          </span>
        ) : (
          <span
            // The ring is the line's colour; a completed stop is filled in with it.
            style={{ borderColor: color, backgroundColor: completed ? color : undefined }}
            className={cn(
              "grid place-items-center rounded-full bg-paper text-paper",
              kind === "hub" ? "size-4 border-[3px] ring-2 ring-paper" : "border-2",
              kind === "stop" && (compact ? "size-1.5" : "size-2.5"),
              selected && "ring-2 ring-ink",
            )}
          >
            {completed && kind === "hub" && <Check className="size-2.5" strokeWidth={4} />}
          </span>
        )}
      </motion.button>
    </Marker>
  );
});
