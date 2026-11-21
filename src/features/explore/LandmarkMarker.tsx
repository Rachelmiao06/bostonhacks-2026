"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { Marker } from "@/lib/map";
import { cn } from "@/lib/utils";
import { content, type Landmark } from "./content";

type Props = {
  landmark: Landmark;
  /** 0.5 to 1.4: models grow as the map zooms in. */
  scale: number;
  selected: boolean;
  onSelect: (landmark: Landmark) => void;
};

const SPRING = { type: "spring", stiffness: 260, damping: 20 } as const;

/**
 * One miniature building floating just above the map, pinned to its real spot.
 * It hovers over a soft shadow, lifts a little on hover, and pops up when selected.
 * The picture comes from `landmark.art`; without one, a plain stand-in block is shown.
 */
export const LandmarkMarker = memo(function LandmarkMarker({ landmark, scale, selected, onSelect }: Props) {
  return (
    <Marker
      longitude={landmark.longitude}
      latitude={landmark.latitude}
      anchor="bottom"
      style={{ zIndex: selected ? 4 : 2 }}
    >
      <motion.button
        type="button"
        aria-label={landmark.name}
        aria-pressed={selected}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(landmark);
        }}
        initial="rest"
        animate={selected ? "selected" : "rest"}
        whileHover={selected ? "selected" : "hover"}
        style={{ scale, transformOrigin: "bottom center" }}
        className="relative grid cursor-pointer justify-items-center outline-none focus-visible:ring-4 focus-visible:ring-graphite/30"
      >
        {/* The model: rises on hover, rises further and grows when selected. */}
        <motion.span
          className="relative z-10 block"
          variants={{
            rest: { y: -6, scale: 1 },
            hover: { y: -12, scale: 1.04 },
            selected: { y: -18, scale: 1.18 },
          }}
          transition={SPRING}
        >
          {landmark.art ? (
            // eslint-disable-next-line @next/next/no-img-element -- hand-made art, shown as drawn
            <img src={landmark.art} alt="" width={96} draggable={false} className="block h-auto w-24" />
          ) : (
            <StandInBlock />
          )}
        </motion.span>

        {/* Contact shadow: tighter and fainter the higher the model floats. */}
        <motion.span
          aria-hidden
          className="absolute bottom-0 h-3 w-16 rounded-[50%] bg-shade blur-[5px]"
          variants={{
            rest: { opacity: 0.5, scaleX: 1 },
            hover: { opacity: 0.38, scaleX: 0.9 },
            selected: { opacity: 0.28, scaleX: 0.78 },
          }}
          transition={SPRING}
        />

        {/* Name tab: only while selected, so the resting map stays uncluttered. */}
        <span
          className={cn(
            "absolute -bottom-5 rounded-sm border border-hairline bg-ivory px-1.5 py-0.5 font-mono text-[0.55rem] leading-none whitespace-nowrap text-graphite uppercase shadow-float transition-opacity duration-200",
            selected ? "opacity-100" : "opacity-0",
          )}
        >
          {landmark.art ? landmark.name : `${landmark.name} · ${content.landmarkPlaceholder}`}
        </span>
      </motion.button>
    </Marker>
  );
});

/**
 * A plain block in three-quarter view. It is not the artwork: it only marks the spot
 * and lets us judge the floating, shadow and hover behaviour until the real model is added.
 */
function StandInBlock() {
  return (
    <svg width="64" height="62" viewBox="0 0 64 62" aria-hidden className="block">
      <g stroke="var(--atlas-outline)" strokeOpacity="0.7" strokeWidth="1" strokeLinejoin="round" strokeDasharray="3 2.5">
        <polygon points="32,2 60,16 32,30 4,16" fill="var(--atlas-road)" />
        <polygon points="4,16 32,30 32,60 4,46" fill="var(--atlas-land)" />
        <polygon points="60,16 32,30 32,60 60,46" fill="var(--atlas-building)" />
      </g>
    </svg>
  );
}
