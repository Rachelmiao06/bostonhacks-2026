"use client";

import { motion } from "motion/react";
import { X } from "lucide-react";
import { Marker } from "@/lib/map";
import { cn } from "@/lib/utils";
import { challengeFor, content, type Landmark } from "./content";
import type { SubwayLine, SubwayStation } from "./types";

type Props = {
  station: SubwayStation;
  /** The station's place in the list, printed as the ticket number. */
  number: number;
  lines: SubwayLine[];
  landmark?: Landmark;
  completed: boolean;
  outage: boolean;
  onOpen: () => void;
  onClose: () => void;
};

/**
 * A small printed ticket that floats above the selected station, pinned to the map.
 * It names the stop and its mission; "View mission" opens the full sheet.
 */
export function MissionTicket({ station, number, lines, landmark, completed, outage, onOpen, onClose }: Props) {
  const challenge = challengeFor(station.id, outage);
  const accent = completed ? "text-leaf border-leaf" : "text-cherry border-cherry";

  return (
    <Marker longitude={station.longitude} latitude={station.latitude} anchor="bottom" offset={[0, -44]} style={{ zIndex: 5 }}>
      <motion.div
        key={station.id}
        role="group"
        aria-label={`${station.name}: ${challenge.title}`}
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        onClick={(event) => event.stopPropagation()}
        className="relative w-60 cursor-default rounded-md border border-ink/25 bg-paper text-ink shadow-[0_14px_24px_-10px_var(--shade)]"
      >
        {/* Stub: issuer, number, close */}
        <div className="flex items-center justify-between gap-2 px-3 pt-2.5 font-mono text-[0.55rem] tracking-wider uppercase text-muted-foreground">
          <span>{content.ticket.issuer}</span>
          <span className="flex items-center gap-1.5">
            {content.ticket.number(number)}
            <button
              type="button"
              aria-label={content.close}
              onClick={onClose}
              className="-mr-1 grid size-5 cursor-pointer place-items-center rounded-full outline-none hover:bg-ink/10 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3" />
            </button>
          </span>
        </div>

        <div className="px-3 pt-1 pb-2.5">
          <h2 className="font-heading text-lg leading-tight font-bold">{station.name}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {lines
              .filter((line) => station.lineIds.includes(line.id))
              .map((line) => (
                <span key={line.id} className="flex items-center gap-1 text-[0.7rem] leading-none">
                  {/* Line colour comes from the MBTA API, not typed in. */}
                  <span className="size-2 rounded-full" style={{ backgroundColor: line.color }} />
                  {line.name}
                </span>
              ))}
          </div>
          {landmark && (
            <p className="mt-1.5 font-mono text-[0.55rem] tracking-wider uppercase text-muted-foreground">
              {content.ticket.landmark(landmark.name)}
            </p>
          )}
        </div>

        {/* Tear line, with a notch punched out of each edge */}
        <div className="relative border-t border-dashed border-ink/30">
          <span className="absolute top-0 -left-1.5 size-3 -translate-y-1/2 rounded-full border border-ink/25 bg-board/20" />
          <span className="absolute top-0 -right-1.5 size-3 -translate-y-1/2 rounded-full border border-ink/25 bg-board/20" />
        </div>

        <div className="flex items-end justify-between gap-3 px-3 pt-2.5 pb-3">
          <div className="min-w-0">
            <p className="font-mono text-[0.55rem] tracking-wider uppercase text-muted-foreground">
              {outage ? content.outageLabel : content.missionLabel}
            </p>
            <p className="font-heading text-sm leading-tight font-bold">{challenge.title}</p>
            <button
              type="button"
              onClick={onOpen}
              className="mt-2 cursor-pointer rounded-full border border-ink bg-ink px-2.5 py-1 text-[0.7rem] leading-none font-bold text-paper outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
            >
              {content.ticket.open}
            </button>
          </div>
          {/* The stamp: red while open, green once done. */}
          <span
            className={cn(
              "grid size-12 shrink-0 -rotate-12 place-items-center rounded-full border-2 border-double font-mono text-[0.55rem] font-bold tracking-wider uppercase",
              accent,
            )}
          >
            {completed ? content.ticket.stampDone : content.ticket.stampOpen}
          </span>
        </div>

        {/* Little tail pointing at the station */}
        <span className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-r border-b border-ink/25 bg-paper" />
      </motion.div>
    </Marker>
  );
}
