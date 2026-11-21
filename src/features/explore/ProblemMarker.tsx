"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { Marker } from "@/lib/map";
import { cn } from "@/lib/utils";
import { categoryOf, categoryStyle } from "./category";
import { categories, content, type CategoryId } from "./content";
import type { Cluster, ProblemStop } from "./quests";
import { verifiedText, type Verified } from "./verified";

const SPRING = { type: "spring", stiffness: 380, damping: 24 } as const;

type PinProps = {
  stop: ProblemStop;
  /** How many of this stop's problems this rider has already finished. */
  doneCount: number;
  selected: boolean;
  /** Zoomed far out: a small coloured dot instead of the full pin. */
  compact: boolean;
  /** Set when the status is green; says who it comes from. Null or missing: the usual warning pin. */
  verified?: Verified | null;
  onSelect: (stop: ProblemStop) => void;
};

type FaceProps = {
  category: CategoryId;
  count: number;
  doneCount: number;
  selected: boolean;
  compact: boolean;
  verified?: Verified | null;
  /** Show the source label above the pin now (the map shows it on hover, focus and selection). */
  showLabel?: boolean;
};

/** The pin's looks, with no map around it, so the preview page can draw the same thing the map does. */
export function PinFace({ category, count, doneCount, selected, compact, verified, showLabel }: FaceProps) {
  const reduce = useReducedMotion() ?? false;
  const style = categoryStyle[category];
  const Icon = verified ? categoryStyle.verify.icon : style.icon;
  const allDone = !verified && doneCount >= count;
  const tone = verified ? categoryStyle.verify : style;

  if (compact) {
    return <span className={cn("block size-3 rounded-full ring-2 ring-ivory shadow-float", allDone ? "bg-taupe" : tone.bg)} />;
  }
  return (
    <>
      {verified && (
        <span
          className={cn(
            "pointer-events-none absolute bottom-full left-1/2 mb-1.5 w-max max-w-[15rem] -translate-x-1/2 rounded-full border border-hairline bg-ivory px-2.5 py-1 text-center font-ui text-[0.65rem] leading-tight font-medium text-graphite shadow-float",
            showLabel || selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
          )}
        >
          {verifiedText(verified)}
        </span>
      )}
      <span
        className={cn(
          "relative grid size-8 place-items-center rounded-full border-2 bg-ivory shadow-float transition-colors",
          verified ? "border-double border-cat-verify/70 bg-cat-verify/10 text-cat-verify" : allDone ? "border-taupe/50 text-taupe" : cn(style.border, style.text),
          selected && "shadow-ticket",
        )}
      >
        <Icon className="size-4" strokeWidth={2.2} aria-hidden />
        {count > 1 && !allDone && !verified && (
          <span className="absolute -top-1.5 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-graphite px-1 font-ui text-[0.6rem] leading-none font-semibold text-ivory tabular-nums">
            {count}
          </span>
        )}
        {verified && (
          // A small stamp thump, like the ticket stamp. With Reduced Motion it is simply there.
          <motion.span
            aria-hidden
            className="absolute -top-1 -right-1.5 grid size-4 place-items-center rounded-full bg-cat-verify text-ivory"
            initial={reduce ? false : { scale: 2.4, opacity: 0, rotate: 12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: reduce ? 0 : 0.15, type: "spring", stiffness: 420, damping: 16 }}
          >
            <Check className="size-2.5" strokeWidth={4} />
          </motion.span>
        )}
        {allDone && (
          <span className="absolute -top-1 -right-1.5 grid size-4 place-items-center rounded-full bg-cat-verify text-ivory">
            <Check className="size-2.5" strokeWidth={4} aria-hidden />
          </span>
        )}
      </span>
      {/* Stem down to the stop itself */}
      <span aria-hidden className={cn("h-2 w-0.5 rounded-full", verified ? "bg-cat-verify/60" : allDone ? "bg-taupe/50" : style.bg)} />
    </>
  );
}

/**
 * A stop with open problems: a small round tag on a short stem, in the colour of its most urgent category.
 * A number shows when there is more than one problem. Once the rider has done them all, the tag gets a check.
 * When the status is verified, the tag turns a quiet green with a stamp, and its label names the source.
 */
export const ProblemPin = memo(function ProblemPin({ stop, doneCount, selected, compact, verified, onSelect }: PinProps) {
  const count = stop.quests.length;
  const allDone = doneCount >= count;

  return (
    <Marker
      longitude={stop.station.longitude}
      latitude={stop.station.latitude}
      anchor="bottom"
      offset={compact ? [0, 4] : [0, 2]}
      style={{ zIndex: selected ? 6 : verified || allDone ? 3 : 4 }}
    >
      <motion.button
        type="button"
        aria-label={verified ? content.verified.marker(stop.station.name, verifiedText(verified)) : content.marker(stop.station.name, count, doneCount)}
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
        className="group relative flex cursor-pointer flex-col items-center rounded-full outline-none focus-visible:ring-4 focus-visible:ring-graphite/30"
      >
        <PinFace category={stop.top} count={count} doneCount={doneCount} selected={selected} compact={compact} verified={verified} />
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
