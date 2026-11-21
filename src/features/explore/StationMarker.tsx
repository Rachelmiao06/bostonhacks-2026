"use client";

import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { Marker } from "@/lib/map";
import { cn } from "@/lib/utils";
import { content } from "./content";
import type { SubwayStation } from "./types";

type Props = {
  station: SubwayStation;
  /** Position in the list, used to stagger the bob so markers do not move in sync. */
  index: number;
  completed: boolean;
  /** True when the MBTA reports an elevator out at this station. */
  outage: boolean;
  onSelect: (station: SubwayStation) => void;
};

/** One pixel sprite floating over a station. Greyed until the station is completed. */
export const StationMarker = memo(function StationMarker({ station, index, completed, outage, onSelect }: Props) {
  // The bob runs as a browser-native animation (off the main thread), so 125 markers
  // cost the page nothing while the map loads. Motion handles only the hover spring.
  const bob = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const animation = img.animate(
        [{ transform: "translateY(0)" }, { transform: "translateY(-5px)" }, { transform: "translateY(0)" }],
        { duration: 2400, iterations: Infinity, easing: "ease-in-out", delay: (index % 12) * -200 },
      );
      return () => animation.cancel();
    },
    [index],
  );

  return (
    <Marker longitude={station.longitude} latitude={station.latitude} anchor="bottom">
      <motion.button
        type="button"
        aria-label={`${station.name}${completed ? ", completed" : ""}${outage ? `, ${content.outageBadge}` : ""}`}
        onClick={() => onSelect(station)}
        initial="rest"
        whileHover="lift"
        whileFocus="lift"
        whileTap={{ scale: 0.9 }}
        className="relative block cursor-pointer p-1.5 outline-none focus-visible:ring-4 focus-visible:ring-ring/60"
      >
        {/* Spring lift on hover */}
        <motion.span
          className="block"
          variants={{ rest: { y: 0, scale: 1 }, lift: { y: -10, scale: 1.35 } }}
          transition={{ type: "spring", stiffness: 420, damping: 14 }}
        >
          {/* Gentle bob: a browser-native animation, see `bob` above */}
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny pixel sprite, must not be resampled */}
          <img
            src={content.sprite(station.lineIds[0])}
            alt=""
            width={content.spriteSize}
            height={content.spriteSize}
            draggable={false}
            ref={bob}
            className={cn(
              "block [image-rendering:pixelated] drop-shadow-[0_3px_0_var(--shade)] transition-[filter,opacity] duration-300",
              !completed && "opacity-75 grayscale",
            )}
          />
        </motion.span>
        {outage && (
          <span className="absolute top-0 right-0 size-3 rounded-full border-2 border-ink bg-destructive" />
        )}
      </motion.button>
    </Marker>
  );
});
