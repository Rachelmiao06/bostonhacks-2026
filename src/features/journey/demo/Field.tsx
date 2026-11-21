"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import type { Quest } from "@/lib/mbta";
import { cn } from "@/lib/utils";
import { questName } from "../content";
import { glyphsFor } from "../vocab";
import { ICONS, TONE } from "./glyphs";

/** A stable 0..1 number from a string, so a problem always lands in the same spot. */
function unit(text: string, salt: number) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

type Props = {
  quests: Quest[];
  doneIds: ReadonlySet<string>;
  /** The problem the map is pointing at next (after a reward). */
  nextId: string | null;
  /** The open problem, and a problem whose draft the rider walked away from. */
  selectedId: string | null;
  parkedId: string | null;
  onSelect: (quest: Quest) => void;
  /** True while a sheet is open: quiet the map so the eye goes to the sheet. */
  dimmed: boolean;
  /** Tapping empty map. The screen decides whether that closes anything. */
  onBackgroundTap: () => void;
};

/**
 * PLACEHOLDER MAP. Draws each problem as a dot; the real home screen draws the real map instead.
 * Whatever draws the map needs to do three things: report a tap on a problem, report a tap on empty map,
 * and mark the quest that has a parked draft.
 */
export function Field({ quests, doneIds, nextId, selectedId, parkedId, dimmed, onSelect, onBackgroundTap }: Props) {
  const points = useMemo(
    () =>
      quests.map((q) => {
        const station = q.stationId ?? q.stationName;
        return {
          q,
          x: 6 + unit(station, 1) * 88 + (unit(q.id, 3) - 0.5) * 5,
          y: 8 + unit(station, 2) * 52 + (unit(q.id, 4) - 0.5) * 5,
        };
      }),
    [quests],
  );

  return (
    <div
      className={cn("absolute inset-0 bg-muted/40 transition-opacity duration-300 motion-reduce:transition-none", dimmed && "opacity-60")}
      data-field
      style={{ backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1.5px)", backgroundSize: "28px 28px" }}
      onClick={onBackgroundTap}
    >
      {points.map(({ q, x, y }) => {
        const done = doneIds.has(q.id);
        const g = glyphsFor(q, { done });
        const Icon = ICONS[g.icon];
        const selected = selectedId === q.id;
        const parked = parkedId === q.id;
        return (
          <button
            key={q.id}
            type="button"
            aria-label={questName(q, g)}
            data-selected={selected ? "" : undefined}
            data-parked={parked ? "" : undefined}
            data-next={nextId === q.id ? "" : undefined}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(q);
            }}
            style={{ left: `${x}%`, top: `${y}%`, width: 28 + g.urgency * 6, height: 28 + g.urgency * 6 }}
            className={cn(
              "absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-background shadow-md outline-none transition-transform duration-200 focus-visible:ring-4 focus-visible:ring-ring motion-reduce:transition-none",
              TONE[g.tone].bg,
              done && "opacity-50 saturate-0",
              selected && "scale-125 ring-4 ring-foreground",
              parked && "outline-2 outline-dashed outline-offset-4 outline-foreground",
              nextId === q.id && "animate-pulse ring-4 ring-primary motion-reduce:animate-none",
            )}
          >
            {done ? <Check className="size-4" aria-hidden /> : <Icon className="size-4" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}
