"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, X } from "lucide-react";
import { content } from "./content";
import { glassSoft } from "./glass";

const FIRST_MS = 700;
const GAP_MS = 1500;

/**
 * What My World is, as three glass notification banners like the ones on a phone: they float up out of the background, soft and translucent, one after
 * another (it keeps growing, gifts and promo codes, your journey) and stay stacked at the top left. Tapping one flies the
 * camera to that part. A small pill hides them all and brings them back (and plays them again).
 * Reduced Motion: they just appear, all at once.
 */
export function WorldNotes({ onPick, hidden }: { onPick: (id: string) => void; hidden?: boolean }) {
  const still = useReducedMotion();
  const n = content.notes;
  const [step, setShown] = useState(0);
  const shown = still ? n.points.length : step; // Reduced Motion: all at once
  const [tucked, setTucked] = useState(false);

  // Play the banners one after another (again each time they are brought back).
  useEffect(() => {
    if (tucked) return;
    if (still) return;
    const ids = n.points.map((_, i) => window.setTimeout(() => setShown((v) => Math.max(v, i + 1)), FIRST_MS + i * GAP_MS));
    return () => ids.forEach(window.clearTimeout);
  }, [tucked, still, n.points]);

  return (
    <div className={`pointer-events-none absolute top-[7.5rem] left-2 z-20 w-[min(20rem,calc(100%-1rem))] flex-col items-start gap-2 sm:left-4 ${hidden ? "hidden" : "flex"}`}>
      {/* the pill: names the stack, and hides or brings it back */}
      <button
        type="button"
        onClick={() => {
          if (tucked) setShown(0);
          setTucked((t) => !t);
        }}
        aria-expanded={!tucked}
        className={`pointer-events-auto inline-flex cursor-pointer items-center gap-1.5 rounded-full py-1 pr-2 pl-3 text-[0.72rem] font-medium text-graphite outline-none focus-visible:ring-4 focus-visible:ring-graphite/25 ${glassSoft}`}
      >
        <span className="relative">{n.pill}</span>
        {tucked ? <ChevronDown className="relative size-3.5" aria-hidden /> : <X className="relative size-3.5" aria-label={n.hide} />}
      </button>

      {!tucked && (
        <ul className="flex w-full flex-col gap-2" aria-label={n.pill}>
          <AnimatePresence initial={false}>
            {n.points.slice(0, shown).map((p) => {
              return (
                <motion.li
                  key={p.id}
                  layout={!still}
                  initial={still ? false : { opacity: 0, y: 46, scale: 0.96, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={still ? undefined : { opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{ type: "spring", stiffness: 90, damping: 18, mass: 1.1 }}
                >
                  <button
                    type="button"
                    onClick={() => onPick(p.id)}
                    className={`pointer-events-auto flex w-full cursor-pointer items-start rounded-3xl px-4 py-2.5 text-left font-ui text-graphite outline-none focus-visible:ring-4 focus-visible:ring-graphite/25 ${glassSoft}`}
                  >
                    <span className="relative min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-sm leading-tight font-semibold">{p.title}</span>
                        <span className="text-[0.62rem] text-taupe">{n.now}</span>
                      </span>
                      <span className="block text-[0.72rem] leading-snug text-taupe">{p.body}</span>
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
