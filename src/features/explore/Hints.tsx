"use client";

import { useEffect, useRef, useState } from "react";
import { Marker, useMap } from "react-map-gl/maplibre";
import { motion, useReducedMotion } from "motion/react";
import { hints } from "./content";
import { hasSeen, markSeen } from "./onboarding";

type LngLat = [number, number];
type Place = "right" | "left" | "above" | "below";
type Choice = { target: LngLat; place: Place; shift: number; tailAt: number };

// The callout's footprint on screen, and the room kept clear around other pins, the top nav and the bottom edge.
const CALLOUT_W = 236;
const CALLOUT_H = 96;
const PIN_BOX = { w: 44, up: 62, down: 10 }; // the target pin: its tag above the stop, plus a little stem
const MARGIN = 10;
const TOP_CLEAR = 96; // under the floating nav and the name tag (phones stack more up there: see below)
const BOTTOM_CLEAR = 64; // above the attribution and zoom controls

type Rect = { l: number; t: number; r: number; b: number };
const hit = (a: Rect, b: Rect) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

/**
 * The first-discovery hint: one small liquid-glass callout, tied to one real challenge pin that is on screen and
 * still open. It sits on whichever side of that pin leaves every other pin, the nav and the screen edges clear,
 * and if no side is clear (or no pin is suitable) it simply does not show. The map stays fully usable; the first
 * thing the rider does (a tap anywhere else, Escape, "Got it") puts it away for good. Never shown twice.
 */
export function MapHint({
  candidates,
  onGone,
  onNone,
}: {
  /** Open, unresolved, unlabelled pins, best first. */
  candidates: LngLat[];
  onGone: () => void;
  onNone: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const { current: map } = useMap();

  // Decided once, when the camera has settled: which pin, and which side of it.
  const [choice] = useState<Choice | null>(() => {
    if (!map) return null;
    const w = map.getContainer().clientWidth;
    const h = map.getContainer().clientHeight;
    const screen = (p: LngLat) => map.project(p);
    // The real footprint of every marker on screen (pins, landmarks, labels, the rider's dot), measured, not guessed.
    const frame = map.getContainer().getBoundingClientRect();
    const markers: Rect[] = [...map.getContainer().querySelectorAll(".maplibregl-marker")].map((el) => {
      const r = el.getBoundingClientRect();
      return { l: r.left - frame.left, r: r.right - frame.left, t: r.top - frame.top, b: r.bottom - frame.top };
    });
    const compact = w < 460;
    const cw = compact ? 176 : CALLOUT_W;
    const topClear = compact ? 156 : TOP_CLEAR;
    for (const target of candidates) {
      const s = screen(target);
      // Only a pin that is really on screen, clear of the nav and the bottom controls.
      if (s.x < MARGIN + 24 || s.x > w - MARGIN - 24 || s.y < topClear + PIN_BOX.up || s.y > h - BOTTOM_CLEAR) continue;
      const mid = s.y - 26;
      // Above or below the pin the callout may slide sideways to stay on screen; its tail still points at the pin.
      const slide = Math.min(Math.max(s.x - cw / 2, MARGIN), w - MARGIN - cw);
      const spots: Record<Place, Rect> = {
        right: { l: s.x + 30, r: s.x + 30 + cw, t: mid - CALLOUT_H / 2, b: mid + CALLOUT_H / 2 },
        left: { l: s.x - 30 - cw, r: s.x - 30, t: mid - CALLOUT_H / 2, b: mid + CALLOUT_H / 2 },
        above: { l: slide, r: slide + cw, t: s.y - PIN_BOX.up - 12 - CALLOUT_H, b: s.y - PIN_BOX.up - 12 },
        below: { l: slide, r: slide + cw, t: s.y + 18, b: s.y + 18 + CALLOUT_H },
      };
      // Also keep clear of the target stop's own name label, which is printed on the map around its foot.
      const ownLabel: Rect = { l: s.x - 80, r: s.x + 80, t: s.y - 10, b: s.y + 26 };
      // Everything except the target's own marker (the one that holds the target's point).
      const clearOf = [ownLabel, ...markers.filter((m) => !(s.x >= m.l && s.x <= m.r && s.y >= m.t && s.y <= m.b))];
      for (const place of ["right", "left", "above", "below"] as Place[]) {
        const r = spots[place];
        const inside = r.l >= MARGIN && r.r <= w - MARGIN && r.t >= topClear && r.b <= h - BOTTOM_CLEAR;
        // A few pixels of give, so touching an edge does not veto an otherwise clear spot.
        const snug: Rect = { l: r.l + 4, r: r.r - 4, t: r.t + 4, b: r.b - 4 };
        if (inside && !clearOf.some((o) => hit(snug, o))) return { target, place, shift: slide + cw / 2 - s.x, tailAt: s.x - slide };
      }
    }
    return null;
  });

  useEffect(() => {
    if (!choice) {
      onNone();
      return;
    }
    markSeen("mapHint");
    // The first real interaction puts the hint away: a tap or click anywhere else (this includes pressing Enter
    // or Space on a pin, which is a click), or Escape. Tab and other keys leave it alone, so a keyboard rider
    // can still reach "Got it" and move through the map.
    const away = (event: Event) => {
      // A tap inside the hint is its own button's job.
      if (event.target instanceof Node && box.current?.contains(event.target)) return;
      onGone();
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && onGone();
    window.addEventListener("pointerdown", away, true);
    window.addEventListener("click", away, true);
    window.addEventListener("keydown", escape, true);
    return () => {
      window.removeEventListener("pointerdown", away, true);
      window.removeEventListener("click", away, true);
      window.removeEventListener("keydown", escape, true);
    };
  }, [choice, onGone, onNone]);

  if (!choice) return null;
  const { target, place, shift, tailAt } = choice;
  const anchor = { right: "left", left: "right", above: "bottom", below: "top" }[place] as "left" | "right" | "bottom" | "top";
  const offset: [number, number] = place === "right" ? [30, -26] : place === "left" ? [-30, -26] : place === "above" ? [shift, -74] : [shift, 18];
  const tail =
    place === "right"
      ? "top-1/2 -left-1.5 -translate-y-1/2 border-b border-l"
      : place === "left"
        ? "top-1/2 -right-1.5 -translate-y-1/2 border-t border-r"
        : place === "above"
          ? "-bottom-1.5 -translate-x-1/2 border-r border-b"
          : "-top-1.5 -translate-x-1/2 border-l border-t";

  return (
    <>
      {/* A glow on the pin itself: a steady ring, plus one slow pulse unless Reduced Motion is on. */}
      <Marker longitude={target[0]} latitude={target[1]} anchor="bottom" offset={[0, -8]} style={{ zIndex: 3, pointerEvents: "none" }}>
        <span aria-hidden className="relative block size-12">
          <span className="absolute inset-0 rounded-full border-2 border-cat-service/45 bg-cat-service/10" />
          {!reduce && <span className="absolute inset-0 rounded-full border-2 border-cat-service/50 animate-ping" />}
        </span>
      </Marker>
      <Marker longitude={target[0]} latitude={target[1]} anchor={anchor} offset={offset} style={{ zIndex: 8 }}>
        <motion.div
          ref={box}
          role="note"
          initial={reduce ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-44 rounded-2xl border border-ivory/80 bg-gradient-to-br from-ivory/80 to-ivory/55 px-3.5 py-3 font-ui text-graphite shadow-float backdrop-blur-xl backdrop-saturate-150 min-[460px]:w-[14.75rem]"
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
          <span aria-hidden className={`absolute size-3 rotate-45 border-ivory/80 bg-ivory/70 ${tail}`} style={place === "above" || place === "below" ? { left: tailAt } : undefined} />
        </motion.div>
      </Marker>
    </>
  );
}

/**
 * Whether this is the rider's first ticket. Decided once when the ticket opens, then written down, so the very
 * next ticket stays clean. The ticket uses the answer for the note and for the glow on its contribution action.
 */
export function useFirstTicket(): boolean {
  const [first] = useState(() => typeof window !== "undefined" && !hasSeen("ticketHint"));
  useEffect(() => {
    if (first) markSeen("ticketHint");
  }, [first]);
  return first;
}

/** The note inside a first ticket: what the rider can do here. A quiet editorial line, not a popup. */
export function TicketHint({ show, className }: { show: boolean; className?: string }) {
  if (!show) return null;
  return (
    <p className={`border-l-2 border-cat-service/50 pl-2.5 font-ui text-xs leading-snug text-taupe ${className ?? ""}`}>
      <span className="font-serif text-sm font-semibold text-graphite">{hints.ticket.title}</span> {hints.ticket.body}
    </p>
  );
}

/** A soft ring that draws the eye to the contribution action on a first ticket. Still, so Reduced Motion needs no change. */
export const firstGlow = "ring-4 ring-cat-service/25";
