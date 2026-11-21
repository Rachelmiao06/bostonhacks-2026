"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { IslandHandle } from "./IslandScene";

const MARGIN = 12;
const TOP_MIN = 76; // keep clear of the nav
const GAP = 20; // between the object and the ticket

type Props = {
  /** The hotspot this ticket belongs to. */
  id: string;
  label: string;
  handle: React.RefObject<IslandHandle | null>;
  onClose: () => void;
  /** Wider for two-column tickets. */
  wide?: boolean;
  children: React.ReactNode;
  /** Receives the close button so the content can place it. */
  closeRef?: React.RefObject<HTMLButtonElement | null>;
};

/**
 * The paper ticket that opens next to an object in the scene. It sits above the object (below it if there is no room),
 * follows it on screen if the camera moves, stays inside the view, and never leaves the island: Esc or the close button
 * returns straight to the same view.
 */
export function TicketFrame({ id, label, handle, onClose, wide, children }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const card_ = useRef<HTMLDivElement>(null);
  const tailUp = useRef<HTMLSpanElement>(null);
  const tailDown = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    // The first focusable thing in the ticket (its close button) takes focus.
    box.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Follow the object on screen. Written straight to the element: no re-render per frame.
  // The ticket picks a side that does not cover the object: above, below or beside it; if none fits it takes the
  // roomier of above and below and scrolls inside.
  useEffect(() => {
    const out = { x: 0, y: 0, visible: true };
    let raf = 0;
    const tick = () => {
      const el = box.current;
      const card = card_.current;
      const h = handle.current;
      const parent = el?.parentElement;
      if (el && card && h && parent) {
        h.hotspotScreen(id, out);
        const W = parent.clientWidth;
        const H = parent.clientHeight;
        const w = el.offsetWidth;
        card.style.maxHeight = "";
        const natural = card.scrollHeight;
        const roomAbove = out.y - GAP - TOP_MIN;
        const roomBelow = H - MARGIN - (out.y + GAP);
        const clampX = (x: number) => Math.min(Math.max(x, MARGIN), Math.max(MARGIN, W - w - MARGIN));
        let left = clampX(out.x - w / 2);
        let top = 0;
        let side: "above" | "below" | "right" | "left" = "above";
        if (natural <= roomAbove) {
          top = out.y - natural - GAP;
        } else if (natural <= roomBelow) {
          side = "below";
          top = out.y + GAP;
        } else if (out.x + 44 + w <= W - MARGIN && natural <= H - TOP_MIN - MARGIN) {
          side = "right";
          left = out.x + 44;
          top = Math.min(Math.max(out.y - natural / 2, TOP_MIN), H - natural - MARGIN);
        } else if (out.x - 44 - w >= MARGIN && natural <= H - TOP_MIN - MARGIN) {
          side = "left";
          left = out.x - 44 - w;
          top = Math.min(Math.max(out.y - natural / 2, TOP_MIN), H - natural - MARGIN);
        } else if (roomAbove >= roomBelow) {
          top = Math.max(TOP_MIN, out.y - GAP - Math.max(120, roomAbove));
          card.style.maxHeight = `${Math.max(120, roomAbove)}px`;
        } else {
          side = "below";
          top = out.y + GAP;
          card.style.maxHeight = `${Math.max(120, roomBelow)}px`;
        }
        el.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
        const tailLeft = `${Math.min(Math.max(out.x - left - 6, 14), w - 26)}px`;
        if (tailUp.current && tailDown.current) {
          tailDown.current.style.display = side === "above" ? "block" : "none";
          tailUp.current.style.display = side === "below" ? "block" : "none";
          tailDown.current.style.left = tailUp.current.style.left = tailLeft;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [handle, id]);

  return (
    <div ref={box} className={cn("pointer-events-none absolute top-0 left-0 z-20 will-change-transform", wide ? "w-[min(35rem,calc(100%-1.5rem))]" : "w-[min(24rem,calc(100%-1.5rem))]")}>
      <div
        ref={card_}
        role="dialog"
        aria-label={label}
        className={cn(
          "pointer-events-auto relative overflow-y-auto rounded-2xl border border-hairline bg-ivory font-ui text-graphite shadow-float transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none",
          shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        )}
      >
        {children}
        <span ref={tailDown} aria-hidden className="absolute -bottom-1.5 hidden size-3 rotate-45 border-r border-b border-hairline bg-ivory" />
        <span ref={tailUp} aria-hidden className="absolute -top-1.5 hidden size-3 rotate-45 border-t border-l border-hairline bg-ivory" />
      </div>
    </div>
  );
}

export const closeButtonClass =
  "inline-flex h-9 cursor-pointer items-center rounded-full bg-graphite px-4 text-xs font-medium text-ivory outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25";
