"use client";

import { useEffect, useRef } from "react";
import { Stamp } from "@/components/shared/stamp";
import { content } from "./content";
import type { Perk } from "./perk";

/**
 * The coupon the knitted parcel holds: a small editorial ticket over the island.
 * A demo perk never shows a code or barcode and says it cannot be redeemed (see perk.ts).
 */
export function PerkTicket({ perk, onClose }: { perk: Perk; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-graphite/25 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <article
        role="dialog"
        aria-modal="true"
        aria-label={content.ticket.label}
        onClick={(e) => e.stopPropagation()}
        className="animate-in fade-in zoom-in-95 slide-in-from-bottom-4 relative w-full max-w-sm rounded-sm border border-hairline bg-ivory p-6 shadow-float duration-500"
      >
        <p className="font-mono text-[0.65rem] tracking-[0.16em] text-taupe uppercase">
          {content.ticket.eyebrow}
          {perk.status === "demo" && ` · ${content.ticket.demo}`}
        </p>
        <h2 className="mt-3 font-serif text-4xl leading-[1.05] font-semibold tracking-tight">{perk.offer}</h2>
        <p className="mt-2 font-serif text-lg text-graphite/80 italic">{content.ticket.at(perk.partner)}</p>

        <div className="my-5 border-t border-dashed border-graphite/25" />

        {perk.status === "demo" && (
          <div className="flex items-center gap-4">
            <Stamp top={content.ticket.stampTop} middle={content.ticket.demo} tone="text-cat-service border-cat-service" size="md" className="-rotate-6" />
            <p className="text-sm leading-relaxed text-graphite">{content.ticket.demoNote}</p>
          </div>
        )}

        <p className="mt-5 text-xs text-taupe">{content.ticket.honest}</p>
        <button
          ref={close}
          type="button"
          onClick={onClose}
          className="mt-5 inline-flex h-10 items-center rounded-full bg-graphite px-5 text-sm font-medium text-ivory outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25"
        >
          {content.ticket.close}
        </button>
      </article>
    </div>
  );
}
