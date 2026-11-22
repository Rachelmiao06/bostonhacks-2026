"use client";

import { memo, useEffect, useRef } from "react";
import gsap from "gsap";
import { Popover } from "@base-ui/react/popover";
import { ExternalLink, X } from "lucide-react";
import { Marker } from "@/lib/map";
import { buPlaces, text, type BuPlace } from "./content";

/** How high a sprite floats above its spot, in px at scale 1. */
const LIFT = 26;

const BuMarker = memo(function BuMarker({ place, scale }: { place: BuPlace; scale: number }) {
  const width = text.width[place.kind] * scale;
  const body = useRef<HTMLSpanElement>(null);
  const shadow = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const parts = [body.current, shadow.current];
    return () => { gsap.killTweensOf(parts); };
  }, []);

  // Same little hop as the other landmarks: squash, jump, settle.
  const hop = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.killTweensOf([body.current, shadow.current]);
    gsap.timeline()
      .to(body.current, { scaleX: 1.1, scaleY: 0.86, duration: 0.1, ease: "power2.out", transformOrigin: "50% 100%" })
      .to(body.current, { scaleX: 0.94, scaleY: 1.12, y: -10, duration: 0.16, ease: "power2.out" })
      .to(body.current, { scaleX: 1, scaleY: 1, y: -5, duration: 0.8, ease: "elastic.out(1, 0.3)" });
    gsap.to(shadow.current, { scale: 0.7, opacity: 0.6, duration: 0.3, ease: "power2.out" });
  };
  const settle = () => {
    gsap.killTweensOf([body.current, shadow.current]);
    gsap.to(body.current, { y: 0, scaleX: 1, scaleY: 1, duration: 0.4, ease: "back.out(2)" });
    gsap.to(shadow.current, { scale: 1, opacity: 1, duration: 0.35, ease: "power2.out" });
  };

  return (
    <Marker longitude={place.longitude} latitude={place.latitude} anchor="bottom" offset={[0, -6]} style={{ zIndex: 2 }}>
      <Popover.Root>
        <Popover.Trigger aria-label={text.open(place.name)} style={{ paddingBottom: LIFT * scale }}
          onPointerEnter={hop} onPointerLeave={settle} onFocus={hop} onBlur={settle}
          className="relative block cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-graphite">
          <span aria-hidden ref={shadow} style={{ width: width * 0.8, height: 7 * scale }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-[50%] bg-graphite/45 blur-[3px]" />
          <span ref={body} className="relative block drop-shadow-[0_3px_2px_rgba(0,0,0,0.25)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- small static sprite, sized by CSS */}
            <img src={`/assets/bu/${place.id}.webp`} alt="" width={width} draggable={false}
              style={{ width, height: "auto" }} className="block max-w-none select-none" />
          </span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="top" sideOffset={6} collisionPadding={12}
            className="z-50 data-[anchor-hidden]:invisible">
            <Popover.Popup className="relative w-64 max-w-[calc(100vw-24px)] rounded-md border border-graphite/25 bg-ivory p-4 text-graphite shadow-ticket">
              <p className="font-ui text-[11px] font-semibold tracking-wide text-taupe uppercase">{text.kind[place.kind]}</p>
              <Popover.Title className="pr-6 font-serif text-xl leading-tight font-semibold">{place.name}</Popover.Title>
              <Popover.Close aria-label={text.close} className="absolute top-2 right-2 cursor-pointer rounded p-1.5"><X size={16} /></Popover.Close>
              <Popover.Description className="mt-2 font-ui text-sm leading-snug">{place.intro}</Popover.Description>
              <a href={place.url} target="_blank" rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-graphite/40 px-3 py-1.5 font-ui text-sm font-medium hover:bg-graphite hover:text-ivory">
                {place.linkLabel}<ExternalLink size={14} aria-hidden />
              </a>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </Marker>
  );
});

/** All BU-area sprites. Render inside the map; each kind appears from its own zoom. */
export function BuMarkers({ zoom }: { zoom: number }) {
  const scale = Math.min(1.2, Math.max(0.6, 0.55 + (zoom - 12) * 0.22));
  return buPlaces
    .filter((place) => zoom >= text.minZoom[place.kind])
    .map((place) => <BuMarker key={place.id} place={place} scale={scale} />);
}
