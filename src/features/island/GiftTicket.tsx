"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { content } from "./content";
import type { Gift } from "./gifts";
import type { IslandHandle } from "./IslandScene";

const MARGIN = 12;
const TOP_MIN = 76; // keep clear of the nav

/**
 * The offer, as a small paper ticket that sits just above the gift in the scene and follows it if the camera moves.
 * It never leaves the island: closing it (button, Esc) returns straight to the same view.
 * Demo gifts are labelled as such and never show a code.
 */
export function GiftTicket({ gift, handle, onClose }: { gift: Gift; handle: React.RefObject<IslandHandle | null>; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const tail = useRef<HTMLSpanElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    closeBtn.current?.focus({ preventScroll: true });
    const raf = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Follow the gift on screen, kept inside the view. Written straight to the element: no re-render per frame.
  useEffect(() => {
    const out = { x: 0, y: 0, visible: true };
    let id = 0;
    const tick = () => {
      const el = box.current;
      const h = handle.current;
      const parent = el?.parentElement;
      if (el && h && parent) {
        h.parcelScreen(out);
        const w = el.offsetWidth;
        const ht = el.offsetHeight;
        const left = Math.min(Math.max(out.x - w / 2, MARGIN), Math.max(MARGIN, parent.clientWidth - w - MARGIN));
        const top = Math.min(Math.max(out.y - ht - 10, TOP_MIN), Math.max(TOP_MIN, parent.clientHeight - ht - MARGIN));
        el.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
        if (tail.current) tail.current.style.left = `${Math.min(Math.max(out.x - left - 6, 14), w - 26)}px`;
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [handle]);

  const p = content.parcel;
  const rows: [string, string][] = [
    [p.merchant, gift.merchant],
    [p.benefit, gift.benefit],
    [p.expires, gift.expires],
    [p.conditions, gift.conditions],
    [p.status, gift.status],
    ...(gift.code ? ([[p.code, gift.code]] as [string, string][]) : []),
    ...(gift.instructions ? ([[p.instructions, gift.instructions]] as [string, string][]) : []),
  ];

  return (
    <div ref={box} className="pointer-events-none absolute top-0 left-0 z-20 w-[min(19.5rem,calc(100%-1.5rem))] will-change-transform">
      <div
        role="dialog"
        aria-label={p.title}
        className={cn(
          "pointer-events-auto relative rounded-2xl border border-hairline bg-ivory p-4 font-ui text-graphite shadow-float transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none",
          shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        )}
      >
        <p className="font-mono text-[0.6rem] tracking-[0.14em] text-cat-station uppercase">{gift.demo ? p.kicker : p.realKicker}</p>
        <h2 className="mt-1 font-serif text-xl leading-tight font-semibold">{p.title}</h2>
        <p className="text-sm text-taupe">{p.subtitle}</p>
        <dl className="mt-3 space-y-2 border-t border-dashed border-graphite/20 pt-3 text-[0.8rem] leading-snug">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="font-mono text-[0.58rem] tracking-[0.12em] text-taupe uppercase">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <button
          ref={closeBtn}
          type="button"
          onClick={onClose}
          className="mt-4 inline-flex h-9 cursor-pointer items-center rounded-full bg-graphite px-4 text-xs font-medium text-ivory outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25"
        >
          {p.close}
        </button>
        {/* a small tab pointing down at the gift */}
        <span ref={tail} aria-hidden className="absolute -bottom-1.5 size-3 rotate-45 border-r border-b border-hairline bg-ivory" />
      </div>
    </div>
  );
}
