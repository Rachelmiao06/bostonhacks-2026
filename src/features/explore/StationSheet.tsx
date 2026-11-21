"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Progress } from "@base-ui/react/progress";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Ribbon } from "@/components/shared/ribbon";
import { challengeFor, content } from "./content";
import { toggleCompleted } from "./progress";
import type { SubwayLine, SubwayStation } from "./types";

type Props = {
  station: SubwayStation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: SubwayLine[];
  stations: SubwayStation[];
  completed: ReadonlySet<string>;
};

/**
 * Station sheet: slides up from the bottom on phones, in from the right on wider screens.
 * Built on the Base UI dialog (same library as components/ui) and kept in this folder for now;
 * move it to components/ui/sheet.tsx when another feature needs a sheet.
 */
export function StationSheet({ station, open, onOpenChange, lines, stations, completed }: Props) {
  if (!station) return null;
  const challenge = challengeFor(station.id);
  const isDone = completed.has(station.id);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-shade transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          className={
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col gap-5 overflow-y-auto rounded-t-3xl border-2 border-ink bg-popover p-6 text-popover-foreground shadow-tile outline-none " +
            "transition-transform duration-300 ease-out data-ending-style:translate-y-full data-starting-style:translate-y-full " +
            "sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:max-h-none sm:w-96 sm:rounded-t-none sm:rounded-l-3xl " +
            "sm:data-ending-style:translate-x-full sm:data-ending-style:translate-y-0 sm:data-starting-style:translate-x-full sm:data-starting-style:translate-y-0"
          }
        >
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="font-heading text-3xl leading-tight font-bold">{station.name}</Dialog.Title>
            <Dialog.Close render={<Button variant="outline" size="icon-sm" aria-label={content.close} />}>
              <X />
            </Dialog.Close>
          </div>

          <section className="flex flex-col gap-3 rounded-2xl border-2 border-ink bg-muted p-4">
            <Ribbon tone="sky" className="self-start">
              {content.missionLabel}
            </Ribbon>
            <h3 className="font-heading text-xl font-bold">{challenge.title}</h3>
            <Dialog.Description className="text-base">{challenge.description}</Dialog.Description>
            <p className="text-sm text-muted-foreground">{content.missionNote}</p>
          </section>

          <section className="flex flex-col gap-4">
            {lines
              .filter((line) => station.lineIds.includes(line.id))
              .map((line) => {
                const done = stations.filter((s) => s.lineIds.includes(line.id) && completed.has(s.id)).length;
                return (
                  <Progress.Root key={line.id} value={done} max={line.stationCount} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <Progress.Label className="font-heading font-bold">{line.name}</Progress.Label>
                      <span className="font-pixel text-[0.6rem]">
                        {content.progressLabel(done, line.stationCount)}
                      </span>
                    </div>
                    <Progress.Track className="h-4 overflow-hidden rounded-full border-2 border-ink bg-paper">
                      {/* Line colour comes from the MBTA API, not typed in. */}
                      <Progress.Indicator
                        className="h-full transition-[width] duration-500"
                        style={{ backgroundColor: line.color }}
                      />
                    </Progress.Track>
                  </Progress.Root>
                );
              })}
          </section>

          <div className="mt-auto flex flex-col gap-2">
            <Button variant={isDone ? "outline" : "default"} size="lg" onClick={() => toggleCompleted(station.id)}>
              {isDone ? content.undo : <><Check /> {content.markDone}</>}
            </Button>
            {isDone && <p className="text-center text-sm text-muted-foreground">{content.doneNote}</p>}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
