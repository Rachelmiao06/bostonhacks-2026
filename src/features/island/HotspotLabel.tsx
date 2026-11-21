"use client";

import { useEffect, useRef } from "react";
import { BookOpen, Gift as GiftIcon, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { glass } from "./glass";
import type { IslandHandle } from "./IslandScene";

const MARGIN = 8;
const TOP_MIN = 84; // under the nav and the title
const ABOVE = 44; // px between the label and the object: well above it, so it never covers it

export type TagIcon = "book" | "gift" | "lock";

/**
 * A small translucent glass tag that stays attached to ONE object, so you can tell what it is at a glance:
 * an icon and one word ("Gift", "Journal", "Locked"). While the object is hovered or focused it grows into a
 * fuller label with a line of explanation. It follows the object's real position on screen (so it stays attached
 * when the camera sways), sits just above it (below it if there is no room), stays inside the screen edges, and is
 * hidden if the object itself is off screen.
 */
export function HotspotLabel({
  id,
  tag,
  icon,
  title,
  sub,
  expanded,
  handle,
}: {
  id: string;
  tag: string;
  icon: TagIcon;
  title: string;
  sub: string;
  expanded: boolean;
  handle: React.RefObject<IslandHandle | null>;
}) {
  const Icon = icon === "book" ? BookOpen : icon === "lock" ? Lock : GiftIcon;
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const out = { x: 0, y: 0, visible: true };
    let raf = 0;
    const tick = () => {
      const node = el.current;
      const h = handle.current;
      const parent = node?.parentElement;
      if (node && h && parent) {
        h.hotspotScreen(id, out);
        const w = node.offsetWidth;
        const ht = node.offsetHeight;
        const x = Math.min(Math.max(out.x - w / 2, MARGIN), Math.max(MARGIN, parent.clientWidth - w - MARGIN));
        const above = out.y - ht - ABOVE >= TOP_MIN;
        const y = above ? out.y - ht - ABOVE : out.y + ABOVE;
        const inView = out.visible && out.x > 0 && out.x < parent.clientWidth && out.y > TOP_MIN - 20 && out.y < parent.clientHeight - 20;
        node.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
        node.style.opacity = inView ? "1" : "0";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [handle, id]);

  return (
    <div
      ref={el}
      aria-hidden
      style={{ opacity: 0 }}
      className={cn(
        "pointer-events-none absolute top-0 left-0 z-10 flex w-max max-w-[13rem] items-center gap-2 font-ui text-graphite will-change-transform",
        glass,
        expanded ? "rounded-2xl px-3 py-1.5" : "rounded-full py-1 pr-3 pl-2",
      )}
    >
      <Icon className={cn("relative shrink-0", expanded ? "size-4.5" : "size-4")} aria-hidden />
      {expanded ? (
        <span className="relative min-w-0">
          <span className="block truncate text-[0.85rem] leading-tight font-semibold">{title}</span>
          <span className="block text-[0.72rem] leading-tight text-graphite/70">{sub}</span>
        </span>
      ) : (
        <span className="relative text-[0.8rem] leading-tight font-semibold">{tag}</span>
      )}
    </div>
  );
}
