"use client";

import { useEffect, useRef } from "react";
import { Gift as GiftIcon, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { content, giftMilestones, type GiftState } from "./content";
import type { Gift } from "./gifts";
import type { IslandHandle } from "./IslandScene";

const MARGIN = 8;
const TOP_MIN = 84; // under the nav and the title
const BELOW = 34; // px under the gift

type Props = {
  gifts: Gift[];
  states: GiftState[];
  /** Journey steps on the island now; null when progress could not be loaded (nothing is claimed). */
  known: number | null;
  handle: React.RefObject<IslandHandle | null>;
  /** Hidden while a ticket is open. */
  hidden: boolean;
  onOpen: (index: number) => void;
};

/**
 * A small floating glass label beside each gift in the scene, so it is clear what the gifts are and which are open:
 * "A free cookie · tap to open", or "Gift 2 · 2 more contributions to open". Each follows its gift on screen and drifts
 * a little (not under Reduced Motion). Tapping a label opens the gift, which also makes a moving gift easy to hit.
 * The labels are for the eyes and the pointer; the keyboard and screen readers use the buttons in Island.tsx.
 */
export function GiftLabels({ gifts, states, known, handle, hidden, onOpen }: Props) {
  const els = useRef<(HTMLButtonElement | null)[]>([]);

  // Follow the gifts, written straight to the elements: no re-render per frame.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const out = { x: 0, y: 0, visible: true };
    let id = 0;
    const tick = (now: number) => {
      const h = handle.current;
      els.current.forEach((el, i) => {
        const parent = el?.parentElement;
        if (!el || !h || !parent) return;
        h.giftScreen(i, out);
        const w = el.offsetWidth;
        const bob = reduced.matches ? 0 : Math.sin(now / 900 + i * 2.1) * 3;
        // kept inside the screen edges; hidden only when the gift itself is off screen
        const x = Math.min(Math.max(out.x - w / 2, MARGIN), Math.max(MARGIN, parent.clientWidth - w - MARGIN));
        const y = out.y + BELOW + bob;
        const inView = out.visible && out.x > 0 && out.x < parent.clientWidth && y > TOP_MIN && y < parent.clientHeight - 60;
        el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
        el.style.opacity = inView ? "1" : "0";
        el.style.pointerEvents = inView ? "auto" : "none";
      });
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [handle, gifts.length]);

  const l = content.label;
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 z-10 transition-opacity duration-300", hidden && "opacity-0")}>
      {gifts.map((gift, i) => {
        const state = states[i];
        const locked = state === "locked";
        const need = known === null ? null : Math.max(0, giftMilestones[i] - known);
        const title = locked ? l.lockedTitle(i + 1) : gift.short;
        const sub = locked ? (need === null ? l.unknownSub : l.lockedSub(need)) : state === "opened" ? l.openedSub : l.readySub(gift.demo);
        return (
          <button
            key={gift.id}
            ref={(el) => {
              els.current[i] = el;
            }}
            type="button"
            tabIndex={-1}
            onClick={() => onOpen(i)}
            style={{ opacity: 0 }}
            className={cn(
              "absolute top-0 left-0 flex max-w-[11.5rem] cursor-pointer items-center gap-2 rounded-2xl border border-ivory/70 bg-linear-to-b from-ivory/70 to-ivory/25 py-1.5 pr-3 pl-2 text-left font-ui text-graphite shadow-float backdrop-blur-xl backdrop-saturate-150 transition-opacity duration-300 will-change-transform",
              locked && "text-graphite/70",
            )}
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full",
                locked ? "bg-graphite/10 text-taupe" : "bg-cat-service/15 text-cat-service",
              )}
            >
              {locked ? <Lock className="size-3.5" /> : <GiftIcon className="size-3.5" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[0.74rem] leading-tight font-semibold">{title}</span>
              <span className="block text-[0.64rem] leading-tight text-graphite/70">{sub}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
