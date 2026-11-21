"use client";

import { useEffect, useRef } from "react";
import type { IslandHandle } from "./IslandScene";

const MARGIN = 10;
const TOP_MIN = 90;

/**
 * A first-visit tip pointing at one object: a bigger bubble above it with a small arrow, following the object on screen,
 * kept inside the screen edges. It bobs gently (not under Reduced Motion). The page highlights the object while it shows.
 */
export function CoachMark({ id, text, skipLabel, onSkip, handle }: { id: string; text: string; skipLabel: string; onSkip: () => void; handle: React.RefObject<IslandHandle | null> }) {
  const el = useRef<HTMLDivElement>(null);
  const arrow = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const out = { x: 0, y: 0, visible: true };
    let raf = 0;
    const tick = (now: number) => {
      const node = el.current;
      const h = handle.current;
      const parent = node?.parentElement;
      if (node && h && parent) {
        h.hotspotScreen(id, out);
        const w = node.offsetWidth;
        const ht = node.offsetHeight;
        const bob = reduced.matches ? 0 : Math.sin(now / 450) * 4;
        const x = Math.min(Math.max(out.x - w / 2, MARGIN), Math.max(MARGIN, parent.clientWidth - w - MARGIN));
        const y = Math.max(TOP_MIN, out.y - ht - 58 + bob);
        node.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
        if (arrow.current) arrow.current.style.left = `${Math.min(Math.max(out.x - x - 7, 16), w - 30)}px`;
        node.style.opacity = out.visible && out.x > 0 && out.x < parent.clientWidth ? "1" : "0";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [handle, id]);

  return (
    <div ref={el} style={{ opacity: 0 }} className="pointer-events-auto absolute top-0 left-0 z-20 w-[min(15rem,calc(100%-1.25rem))] rounded-2xl border border-ivory/80 bg-ivory/95 p-3.5 font-ui text-graphite shadow-float backdrop-blur-xl will-change-transform">
      <p role="status" className="text-sm leading-snug font-medium">
        {text}
      </p>
      <button type="button" onClick={onSkip} className="mt-2 cursor-pointer text-[0.72rem] text-taupe underline underline-offset-2 outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/30">
        {skipLabel}
      </button>
      <span ref={arrow} aria-hidden className="absolute -bottom-1.5 size-3.5 rotate-45 border-r border-b border-ivory/80 bg-ivory/95" />
    </div>
  );
}
