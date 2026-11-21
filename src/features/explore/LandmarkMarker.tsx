"use client";

import { memo } from "react";
import { Popover } from "@base-ui/react/popover";
import { X } from "lucide-react";
import { Marker } from "@/lib/map";
import type { Landmark } from "./content";
import { landmarkWidth, PixelLandmark } from "./PixelLandmark";

/** How high a building floats above its spot on the map, in px at scale 1. */
const LIFT = 30;

export const LandmarkMarker = memo(function LandmarkMarker({ landmark, scale }: {
  landmark: Landmark;
  scale: number;
}) {
  // The Old State House stands over State station; leave the problem sign its own hit target.
  const aboveState = landmark.id === "old-state-house";
  const width = (aboveState ? landmarkWidth.station : landmarkWidth.scenic) * scale;
  const lift = LIFT * scale;
  return (
    <Marker longitude={landmark.longitude} latitude={landmark.latitude} anchor="bottom"
      offset={[aboveState ? width / 2 + 20 : 0, -6]} style={{ zIndex: 2 }}>
      <Popover.Root>
        <Popover.Trigger aria-label={`History of ${landmark.name}`} style={{ paddingBottom: lift }}
          className="group relative block cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-graphite">
          {/* The ground shadow sits far below the building, so it reads as hovering over the map. */}
          <span aria-hidden style={{ width: width * 0.8, height: 7 * scale }}
            className="absolute bottom-0 left-[55%] -translate-x-1/2 rounded-[50%] bg-graphite/45 blur-[3px] motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-90" />
          {/* Two thin stilts hold it up. */}
          <span aria-hidden style={{ height: lift + 2, bottom: 2 * scale }}
            className="absolute left-[24%] w-[2px] bg-graphite/80" />
          <span aria-hidden style={{ height: lift + 2, bottom: 2 * scale }}
            className="absolute right-[24%] w-[2px] bg-graphite/80" />
          {/* The building itself, lifted, with a soft shadow underneath. */}
          <span className="relative block drop-shadow-[0_3px_2px_rgba(0,0,0,0.25)] motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:-translate-y-1.5">
            <PixelLandmark art={landmark.id} size={width} />
          </span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="top" sideOffset={6} collisionPadding={12}
            className="z-50 data-[anchor-hidden]:invisible">
            <Popover.Popup className="relative w-64 max-w-[calc(100vw-24px)] rounded-md border border-graphite/25 bg-ivory p-4 text-graphite shadow-ticket">
              <Popover.Title className="pr-6 font-serif text-xl leading-tight font-semibold">{landmark.name}</Popover.Title>
              <Popover.Close aria-label="Close history" className="absolute top-2 right-2 cursor-pointer rounded p-1.5"><X size={16} /></Popover.Close>
              <Popover.Description className="mt-2 font-ui text-sm leading-snug">{landmark.story}</Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </Marker>
  );
});
