"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Marker } from "@/lib/map";
import { cn } from "@/lib/utils";
import { categoryOf, categoryStyle } from "./category";
import { categories, content } from "./content";
import type { Cluster, ProblemStop } from "./quests";

const SPRING = { type: "spring", stiffness: 380, damping: 24 } as const;

type PinProps = {
  stop: ProblemStop;
  /** How many of this stop's problems this rider has already finished. */
  doneCount: number;
  selected: boolean;
  /** Zoomed far out: a small coloured dot instead of the full pin. */
  compact: boolean;
  onSelect: (stop: ProblemStop) => void;
};

/**
 * A stop with open problems: a small round tag on a short stem, in the colour of its most urgent category.
 * A number shows when there is more than one problem. Once the rider has done them all, the tag gets a check.
 */
export const ProblemPin = memo(function ProblemPin({ stop, doneCount, selected, compact, onSelect }: PinProps) {
  const style = categoryStyle[stop.top];
  const Icon = style.icon;
  const count = stop.quests.length;
  const allDone = doneCount >= count;

  return (
    <Marker
      longitude={stop.station.longitude}
      latitude={stop.station.latitude}
      anchor="bottom"
      offset={compact ? [0, 4] : [0, 2]}
      style={{ zIndex: selected ? 6 : allDone ? 3 : 4 }}
    >
      <motion.button
        type="button"
        aria-label={content.marker(stop.station.name, count, doneCount)}
        aria-pressed={selected}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(stop);
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: selected ? -6 : 0, scale: selected ? 1.15 : 1 }}
        whileHover={{ y: selected ? -6 : -3 }}
        whileTap={{ scale: 0.95 }}
        transition={SPRING}
        className="group flex cursor-pointer flex-col items-center rounded-full outline-none focus-visible:ring-4 focus-visible:ring-graphite/30"
      >
        {compact ? (
          <span className={cn("block size-3 rounded-full ring-2 ring-ivory shadow-float", allDone ? "bg-taupe" : style.bg)} />
        ) : (
          <>
            <span
              className={cn(
                "relative grid size-8 place-items-center rounded-full border-2 bg-ivory shadow-float transition-colors",
                allDone ? "border-taupe/50 text-taupe" : cn(style.border, style.text),
                selected && "shadow-ticket",
              )}
            >
              <Icon className="size-4" strokeWidth={2.2} aria-hidden />
              {count > 1 && !allDone && (
                <span className="absolute -top-1.5 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-graphite px-1 font-ui text-[0.6rem] leading-none font-semibold text-ivory tabular-nums">
                  {count}
                </span>
              )}
              {allDone && (
                <span className="absolute -top-1 -right-1.5 grid size-4 place-items-center rounded-full bg-cat-verify text-ivory">
                  <Check className="size-2.5" strokeWidth={4} aria-hidden />
                </span>
              )}
            </span>
            {/* Stem down to the stop itself */}
            <span aria-hidden className={cn("h-2 w-0.5 rounded-full", allDone ? "bg-taupe/50" : style.bg)} />
          </>
        )}
      </motion.button>
    </Marker>
  );
});

type ClusterProps = {
  cluster: Cluster;
  onExpand: (cluster: Cluster) => void;
};

/** Several stops that would overlap at this zoom. Shows the total and which kinds of problem are inside. Tap to zoom in. */
export const ClusterPin = memo(function ClusterPin({ cluster, onExpand }: ClusterProps) {
  const total = cluster.stops.reduce((sum, stop) => sum + stop.quests.length, 0);
  const present = new Set(cluster.stops.flatMap((stop) => stop.quests.map(categoryOf)));
  const kinds = categories.filter((c) => present.has(c.id));

  return (
    <Marker longitude={cluster.longitude} latitude={cluster.latitude} anchor="center" style={{ zIndex: 5 }}>
      <motion.button
        type="button"
        aria-label={content.cluster(total)}
        onClick={(event) => {
          event.stopPropagation();
          onExpand(cluster);
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        transition={SPRING}
        className="grid cursor-pointer place-items-center gap-0.5 rounded-full border border-hairline bg-ivory/95 px-2.5 pt-1.5 pb-1 text-graphite shadow-float outline-none backdrop-blur focus-visible:ring-4 focus-visible:ring-graphite/30"
      >
        <span className="font-serif text-base leading-none font-semibold tabular-nums">{total}</span>
        <span aria-hidden className="flex gap-0.5">
          {kinds.map((c) => (
            <span key={c.id} className={cn("size-1.5 rounded-full", categoryStyle[c.id].bg)} />
          ))}
        </span>
      </motion.button>
    </Marker>
  );
});
