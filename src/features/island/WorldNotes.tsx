"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, X } from "lucide-react";
import { content } from "./content";
import { glassSoft } from "./glass";

const FIRST_MS = 700;
const EVERY_MS = 3800;
// Where a banner sits by how many newer ones are in front of it: the newest is in front; older ones tuck behind it.
const rank = [
  { y: 0, scale: 1, opacity: 1 },
  { y: -9, scale: 0.95, opacity: 0.6 },
  { y: -17, scale: 0.9, opacity: 0.3 },
];

/**
 * What My World is, as phone-style notification banners that roll one at a time: each new banner floats up out of the
 * background and covers the last, which tucks behind it (it keeps growing, gifts and promo codes, your journey, then round
 * again). Pointing at them pauses the roll. Tapping the front one flies the camera to that part. A small pill hides them
 * and brings them back. Reduced Motion: no rolling; the dots pick which banner to read.
 */
export function WorldNotes({ onPick, hidden, low }: { onPick: (id: string) => void; hidden?: boolean; low?: boolean }) {
  const still = useReducedMotion();
  const points = content.notes.points;
  const n = content.notes;
  const [count, setCount] = useState(0); // banners shown so far; banner number c is point c % 3
  const [tucked, setTucked] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (tucked) return;
    if (still) {
      const id = window.setTimeout(() => setCount((c) => Math.max(c, 1)), 300);
      return () => window.clearTimeout(id);
    }
    if (paused || hidden) return;
    const id = window.setTimeout(() => setCount((c) => c + 1), count === 0 ? FIRST_MS : EVERY_MS);
    return () => window.clearTimeout(id);
  }, [tucked, still, paused, hidden, count]);

  const front = count - 1;
  const shown = [front, front - 1, front - 2].filter((c) => c >= 0);

  return (
    <div
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      className={`pointer-events-none absolute ${low ? "top-[9.5rem]" : "top-[7.75rem]"} left-2 z-20 w-[min(20rem,calc(100%-1rem))] flex-col items-start gap-2 sm:left-4 ${hidden ? "hidden" : "flex"}`}
    >
      {/* the pill: names the banners, and hides or brings them back */}
      <button
        type="button"
        onClick={() => {
          if (tucked) setCount(0);
          setTucked((t) => !t);
        }}
        aria-expanded={!tucked}
        className={`pointer-events-auto inline-flex cursor-pointer items-center gap-1.5 rounded-full py-1 pr-2 pl-3 text-[0.72rem] font-medium text-graphite outline-none focus-visible:ring-4 focus-visible:ring-graphite/25 ${glassSoft}`}
      >
        <span className="relative">{n.pill}</span>
        {tucked ? <ChevronDown className="relative size-3.5" aria-hidden /> : <X className="relative size-3.5" aria-label={n.hide} />}
      </button>

      {!tucked && (
        <div className="w-full pt-5">
          <div className="grid w-full" aria-live="off">
            <AnimatePresence initial={false}>
              {shown.map((c) => {
                const r = front - c;
                const p = points[((c % points.length) + points.length) % points.length];
                return (
                  <motion.div
                    key={c}
                    style={{ gridArea: "1 / 1", zIndex: 10 - r, transformOrigin: "50% 100%" }}
                    initial={still ? false : { opacity: 0, y: 48, scale: 0.96, filter: "blur(6px)" }}
                    animate={{ ...rank[r], filter: "blur(0px)" }}
                    exit={still ? undefined : { opacity: 0, y: -26, scale: 0.86, filter: "blur(4px)" }}
                    transition={{ type: "spring", stiffness: 110, damping: 18, mass: 1 }}
                  >
                    <button
                      type="button"
                      tabIndex={r === 0 ? 0 : -1}
                      aria-hidden={r === 0 ? undefined : true}
                      onClick={() => onPick(p.id)}
                      className={`pointer-events-auto flex w-full cursor-pointer items-start rounded-3xl px-4 py-2.5 text-left font-ui text-graphite outline-none focus-visible:ring-4 focus-visible:ring-graphite/25 ${glassSoft}`}
                    >
                      <span className={`relative min-w-0 flex-1 transition-opacity duration-300 ${r === 0 ? "opacity-100" : "opacity-0"}`}>
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="text-sm leading-tight font-semibold">{p.title}</span>
                          <span className="text-[0.62rem] text-taupe">{n.now}</span>
                        </span>
                        <span className="block text-[0.72rem] leading-snug text-taupe">{p.body}</span>
                      </span>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          <div className="pointer-events-auto mt-2.5 flex gap-1.5 pl-3" role="group" aria-label={n.pill}>
            {points.map((p, i) => (
              <button
                key={p.id}
                type="button"
                aria-label={p.title}
                onClick={() => setCount(Math.max(0, front) - (((Math.max(0, front) % points.length) + points.length) % points.length) + i + 1)}
                className={`h-1.5 cursor-pointer rounded-full outline-none transition-all focus-visible:ring-2 focus-visible:ring-graphite/40 ${front >= 0 && front % points.length === i ? "w-4 bg-graphite" : "w-1.5 bg-graphite/30"}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
