"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { Popover } from "@base-ui/react/popover";
import { ExternalLink, Landmark, Utensils, X } from "lucide-react";
import { Marker, useMap } from "@/lib/map";
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
            {place.art === false ? (
              <span style={{ width: width * 0.6, height: width * 0.6 }}
                className={`flex items-center justify-center rounded-sm border-2 border-graphite text-ivory shadow-[2px_2px_0_0_var(--graphite)] ${place.kind === "food" ? "bg-cat-service" : "bg-cat-station"}`}>
                {place.kind === "food" ? <Utensils size={width * 0.34} aria-hidden /> : <Landmark size={width * 0.34} aria-hidden />}
              </span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- small static sprite, sized by CSS
              <img src={`/assets/bu/${place.id}.webp`} alt="" width={width} draggable={false}
                style={{ width, height: "auto" }} className="block max-w-none select-none" />
            )}
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

/** Metres on the ground that one screen pixel covers, at this zoom and latitude. */
const metresPerPixel = (zoom: number, latitude: number) => 156543.03392 * Math.cos((latitude * Math.PI) / 180) / 2 ** zoom;

/** Rough ground distance in metres between two points (fine at city scale). */
const metres = (a: { longitude: number; latitude: number }, b: { longitude: number; latitude: number }) =>
  Math.hypot((a.latitude - b.latitude) * 111_000, (a.longitude - b.longitude) * 111_000 * Math.cos((a.latitude * Math.PI) / 180));

/** Something already drawn on the map that our sprites must not cover (the older landmarks). */
export type Blocker = { longitude: number; latitude: number };

/**
 * The BU-area sprites. Render inside the map.
 * Flat map: sprites are placed in the order of `buPlaces` (most important first). A sprite is drawn only if it
 * would not overlap one already drawn, so the map thins out when zoomed out and fills in as you zoom in.
 * 3D world: pass the places inside that world; the same rule applies, so a crowded street shows one sprite per spot.
 */
export function BuMarkers({ places, blockers = [] }: { places?: BuPlace[]; blockers?: Blocker[] }) {
  const { current: map } = useMap();
  const [zoom, setZoom] = useState(() => map?.getZoom() ?? 12);
  useEffect(() => {
    if (!map) return;
    const read = () => setZoom(Math.round(map.getZoom() * 4) / 4);
    read();
    map.on("zoom", read);
    return () => { map.off("zoom", read); };
  }, [map]);

  const scale = Math.min(1.15, Math.max(0.55, 0.45 + (zoom - 12) * 0.22));

  const shown = useMemo(() => {
    if (!places && zoom < text.minZoom) return [];
    const mpp = metresPerPixel(zoom, 42.35);
    const gap = (box: number) => box * mpp * text.spacing;
    // Older landmarks come first and are never moved; ours fit around them.
    const placed: { longitude: number; latitude: number; box: number }[] =
      blockers.map((b) => ({ ...b, box: text.blockerWidth * Math.min(1.4, Math.max(0.5, 0.55 + (zoom - 12) * 0.22)) }));
    const out: BuPlace[] = [];
    for (const place of places ?? buPlaces) {
      const box = text.width[place.kind] * scale;
      const clear = placed.every((other) => metres(place, other) >= gap((box + other.box) / 2));
      if (!clear) continue;
      placed.push({ longitude: place.longitude, latitude: place.latitude, box });
      out.push(place);
    }
    return out;
  }, [places, zoom, scale, blockers]);

  return shown.map((place) => <BuMarker key={place.id} place={place} scale={scale} />);
}
