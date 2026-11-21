"use client";

import { memo, useEffect, useRef } from "react";
import gsap from "gsap";
import { Popover } from "@base-ui/react/popover";
import { X } from "lucide-react";
import { Marker } from "@/lib/map";
import type { Landmark } from "./content";
import { landmarkWidth, PixelLandmark } from "./PixelLandmark";

/** How high a building floats above its spot on the map, in px at scale 1. */
const LIFT = 30;

const SPARKS = [
  { x: -22, y: -26 },
  { x: 24, y: -20 },
  { x: 2, y: -38 },
];

export const LandmarkMarker = memo(function LandmarkMarker({ landmark, scale }: {
  landmark: Landmark;
  scale: number;
}) {
  // The Old State House stands over State station; leave the problem sign its own hit target.
  const aboveState = landmark.id === "old-state-house";
  const width = (aboveState ? landmarkWidth.station : landmarkWidth.scenic) * scale;
  const lift = LIFT * scale;
  const body = useRef<HTMLSpanElement>(null);
  const shadow = useRef<HTMLSpanElement>(null);
  const sparks = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const parts = [body.current, shadow.current, sparks.current];
    return () => { gsap.killTweensOf(parts); };
  }, []);

  // Cute hover: squash, hop, wiggle, then settle a little higher; the shadow shrinks and stars pop out.
  const hop = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.killTweensOf([body.current, shadow.current]);
    gsap.timeline()
      .to(body.current, { scaleX: 1.12, scaleY: 0.84, duration: 0.1, ease: "power2.out", transformOrigin: "50% 100%" })
      .to(body.current, { scaleX: 0.92, scaleY: 1.14, y: -12, duration: 0.16, ease: "power2.out" })
      .to(body.current, { scaleX: 1, scaleY: 1, y: -6, duration: 0.9, ease: "elastic.out(1, 0.3)" })
      .fromTo(body.current, { rotation: -6 }, { rotation: 0, duration: 0.9, ease: "elastic.out(1, 0.25)" }, "<-0.8");
    gsap.to(shadow.current, { scale: 0.7, opacity: 0.6, duration: 0.3, ease: "power2.out" });
    if (sparks.current) {
      gsap.fromTo(sparks.current.children,
        { scale: 0, opacity: 1, y: 0, rotation: -30 },
        { scale: 1, opacity: 0, y: -10, rotation: 20, duration: 0.75, ease: "back.out(2.5)", stagger: 0.06 });
    }
  };
  const settle = () => {
    gsap.killTweensOf([body.current, shadow.current]);
    gsap.to(body.current, { y: 0, scaleX: 1, scaleY: 1, rotation: 0, duration: 0.45, ease: "back.out(2)" });
    gsap.to(shadow.current, { scale: 1, opacity: 1, duration: 0.4, ease: "power2.out" });
  };

  return (
    <Marker longitude={landmark.longitude} latitude={landmark.latitude} anchor="bottom"
      offset={[aboveState ? width / 2 + 20 : 0, -6]} style={{ zIndex: 2 }}>
      <Popover.Root>
        <Popover.Trigger aria-label={`History of ${landmark.name}`} style={{ paddingBottom: lift }}
          onPointerEnter={hop} onPointerLeave={settle} onFocus={hop} onBlur={settle}
          className="group relative block cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-graphite">
          {/* The ground shadow sits far below the building, so it reads as hovering over the map. */}
          <span aria-hidden ref={shadow} style={{ width: width * 0.8, height: 7 * scale }}
            className="absolute bottom-0 left-[55%] -translate-x-1/2 rounded-[50%] bg-graphite/45 blur-[3px]" />
          {/* The building itself, lifted, with a soft shadow underneath. */}
          <span ref={body} className="relative block drop-shadow-[0_3px_2px_rgba(0,0,0,0.25)]">
            <PixelLandmark art={landmark.id} size={width} />
          </span>
          {/* Little stars that pop out on hover. */}
          <span ref={sparks} aria-hidden className="pointer-events-none absolute top-1/3 left-1/2">
            {SPARKS.map(({ x, y }, i) => (
              <span key={i} style={{ left: x, top: y }}
                className="absolute text-sm leading-none text-sun opacity-0 [text-shadow:0_0_2px_var(--graphite)]">✦</span>
            ))}
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
