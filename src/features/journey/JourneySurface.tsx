"use client";

import type { ReactNode } from "react";
import { words } from "./content";
import type { JourneyApi } from "./useJourney";

type Props = {
  journey: JourneyApi;
  /** The map. Always mounted, so the rider never loses their place. */
  map: ReactNode;
  /** The sheet that rises from the bottom. What it shows is up to the screen; `journey.layers` says how open it is. */
  sheet: ReactNode;
  /** The short celebration. Shown only in the reward stage. */
  overlay?: ReactNode;
};

/**
 * THE LAYOUT CONTRACT. One surface, three layers, no pages and no tabs.
 *
 * It fills whatever box its parent gives it (`h-full w-full`), so the same surface works as the whole home
 * screen or as a smaller preview. It sets data attributes and nothing else about looks, so any design can
 * restyle it from CSS without editing this file:
 *
 *   [data-stage="drafting"]   the stage (see machine.ts)
 *   [data-sheet="open"]       hidden | peek | open
 *   [data-status="pending"]   none | pending | needs_work | passed | failed | sending
 *   [data-layer="map" data-dimmed]   the map layer, dimmed while a sheet is open
 *
 * The only text it renders is a visually hidden live region, so a screen reader hears each change.
 */
export function JourneySurface({ journey, map, sheet, overlay }: Props) {
  const { state, layers, announce } = journey;

  return (
    <section
      aria-label={words.surface}
      data-journey
      data-stage={state.stage}
      data-sheet={layers.sheet}
      data-status={layers.status}
      data-overlay={layers.overlay}
      className="relative h-full w-full overflow-hidden"
    >
      <div data-layer="map" data-dimmed={layers.map === "dimmed" ? "" : undefined} className="absolute inset-0">
        {map}
      </div>

      <div
        data-layer="sheet"
        aria-hidden={layers.sheet === "hidden"}
        inert={layers.sheet === "hidden"}
        className="absolute inset-x-0 bottom-0 transition-transform duration-300 ease-out motion-reduce:transition-none data-[sheet=hidden]:translate-y-full data-[sheet=peek]:translate-y-[calc(100%-7rem)]"
        data-sheet={layers.sheet}
      >
        {sheet}
      </div>

      {layers.overlay === "reward" && (
        <div data-layer="overlay" className="pointer-events-none absolute inset-0">
          {overlay}
        </div>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>
    </section>
  );
}
