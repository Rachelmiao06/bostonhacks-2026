"use client";

import { useEffect, useRef, useState } from "react";
import { Marker, useMap } from "react-map-gl/maplibre";
import { motion, useReducedMotion } from "motion/react";
import { hints } from "./content";
import { hasSeen, markSeen } from "./onboarding";

/**
 * The first-map hint: one small glass callout anchored above a real pin, with a single quiet pulse.
 * The rest of the map stays usable. The first thing the rider does (a tap anywhere else, a key, "Got it")
 * puts it away for good, and it is never shown twice.
 */
export function MapHint({ longitude, latitude, onGone }: { longitude: number; latitude: number; onGone: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const { current: map } = useMap();
  // Near the screen's left or right edge the callout grows inward, so it is never cut off.
  const [side] = useState<"left" | "center" | "right">(() => {
    if (!map) return "center";
    const x = map.project([longitude, latitude]).x;
    const width = map.getContainer().clientWidth;
    return x < 130 ? "left" : x > width - 130 ? "right" : "center";
  });

  useEffect(() => {
    markSeen("mapHint");
    const away = (event: Event) => {
      // A tap inside the hint is its own button's job.
      if (event.target instanceof Node && box.current?.contains(event.target)) return;
      onGone();
    };
    window.addEventListener("pointerdown", away, true);
    window.addEventListener("keydown", away, true);
    return () => {
      window.removeEventListener("pointerdown", away, true);
      window.removeEventListener("keydown", away, true);
    };
  }, [onGone]);

  return (
    <>
      {/* the pulse sits on the pin itself */}
      <Marker longitude={longitude} latitude={latitude} anchor="bottom" offset={[0, -10]} style={{ zIndex: 3, pointerEvents: "none" }}>
        <span aria-hidden className="block size-12 rounded-full border-2 border-cat-service/50 motion-safe:animate-ping" />
      </Marker>
      <Marker longitude={longitude} latitude={latitude} anchor={side === "center" ? "bottom" : side === "left" ? "bottom-left" : "bottom-right"} offset={[side === "left" ? -20 : side === "right" ? 20 : 0, -58]} style={{ zIndex: 8 }}>
        <motion.div
          ref={box}
          role="note"
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-60 rounded-2xl border border-ivory/70 bg-ivory/80 px-3.5 py-3 font-ui text-graphite shadow-float backdrop-blur-xl"
        >
          <p className="font-serif text-base leading-tight font-semibold">{hints.map.title}</p>
          <p className="mt-0.5 text-xs leading-snug text-taupe">{hints.map.body}</p>
          <button
            type="button"
            onClick={onGone}
            className="mt-2 cursor-pointer rounded-full text-xs font-medium underline decoration-graphite/30 underline-offset-4 outline-none hover:decoration-graphite focus-visible:ring-2 focus-visible:ring-graphite/30"
          >
            {hints.map.dismiss}
          </button>
          <span aria-hidden className={`absolute -bottom-1.5 size-3 rotate-45 border-r border-b border-ivory/70 bg-ivory/80 ${side === "center" ? "left-1/2 -translate-x-1/2" : side === "left" ? "left-4" : "right-4"}`} />
        </motion.div>
      </Marker>
    </>
  );
}

/**
 * A line inside the ticket, the first time a rider opens one: what they can do here.
 * Written as a quiet editorial note, not a banner. It stays for as long as that ticket is open.
 */
export function TicketHint({ verify, className }: { verify: boolean; className?: string }) {
  // Decided once, when the first ticket opens; the "seen" mark is written right after, so the next ticket stays clean.
  const [show] = useState(() => typeof window !== "undefined" && !hasSeen("ticketHint"));
  useEffect(() => {
    if (show) markSeen("ticketHint");
  }, [show]);
  if (!show) return null;
  const text = verify ? hints.ticket.verify : hints.ticket.report;
  return (
    <p className={`border-l-2 border-cat-service/50 pl-2.5 font-ui text-xs leading-snug text-taupe ${className ?? ""}`}>
      <span className="font-serif text-sm font-semibold text-graphite">{text.title}</span> {text.body}
    </p>
  );
}
