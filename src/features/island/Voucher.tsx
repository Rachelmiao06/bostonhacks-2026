"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** A real photo, or an illustration of the kind of place. */
  art: React.ReactNode;
  /** A small chip over the picture, e.g. "Nearby · 520 ft". */
  chip?: string;
  /** A stamp across the picture, e.g. "Demo — Not Redeemable". */
  stamp?: string;
  kicker: string;
  title: string;
  sub: string;
  /** The (demo) offer, as a boxed line. Real places have none and leave this out. */
  offer?: { label: string; text: string };
  /** Below the tear line: the action (reveal a code, open the map). */
  stub: React.ReactNode;
  /** The smallest print and quiet links, under the stub. */
  foot?: React.ReactNode;
  closeLabel: string;
  onClose: () => void;
};

const EDGE = 7; // px depth of the zig-zag receipt edge
const zigzag = `linear-gradient(#000 0 0) top / 100% calc(100% - ${EDGE}px) no-repeat, conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / ${EDGE * 2}px ${EDGE}px repeat-x`;

/** One part of the voucher: it unfolds (grows from nothing to its height) when `open` turns on. */
function Fold({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("grid transition-[grid-template-rows] duration-500 ease-out motion-reduce:transition-none", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

/**
 * A small paper voucher, like a printed receipt: a picture, the place, the offer, a dashed tear line and a stub,
 * with a zig-zag bottom edge. It unfolds part by part (picture, name, offer, stub), growing out of the gift.
 * Under Reduced Motion it simply appears. It carries no price, no cart and no checkout: nothing here can be bought.
 */
export function Voucher({ art, chip, stamp, kicker, title, sub, offer, stub, foot, closeLabel, onClose }: Props) {
  const [step, setStep] = useState(() => (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 4 : 0));

  useEffect(() => {
    if (step >= 4) return;
    const t = window.setTimeout(() => setStep((s) => s + 1), step === 0 ? 120 : 260);
    return () => window.clearTimeout(t);
  }, [step]);

  return (
    <article className="relative bg-ivory text-graphite" style={{ WebkitMask: zigzag, mask: zigzag }}>
      <Fold open={step >= 1}>
        <div className="relative aspect-[21/9] overflow-hidden rounded-t-2xl bg-stone sm:aspect-[16/9]">
          {art}
          {chip && <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full border border-ivory/80 bg-ivory/80 px-2.5 py-0.5 text-[0.7rem] font-medium backdrop-blur-md">{chip}</span>}
          {stamp && (
            <span className="absolute right-3 bottom-3 -rotate-6 rounded-sm border-2 border-double border-cat-service bg-ivory/80 px-2 py-0.5 font-mono text-[0.58rem] font-semibold tracking-[0.14em] text-cat-service uppercase">
              {stamp}
            </span>
          )}
          <button
            data-autofocus
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="absolute top-2 right-2 grid size-8 cursor-pointer place-items-center rounded-full border border-ivory/80 bg-ivory/85 text-graphite outline-none backdrop-blur-md hover:bg-ivory focus-visible:ring-4 focus-visible:ring-graphite/25"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </Fold>

      <Fold open={step >= 2}>
        <div className="px-4 pt-3">
          <p className="font-mono text-[0.58rem] tracking-[0.14em] text-cat-station uppercase">{kicker}</p>
          <h2 className="mt-0.5 font-serif text-xl leading-tight font-semibold">{title}</h2>
          <p className="text-[0.82rem] leading-snug text-graphite/75">{sub}</p>
        </div>
      </Fold>

      {offer && (
        <Fold open={step >= 3}>
          <div className="px-4 pt-3">
            <p className="rounded-xl border border-dashed border-graphite/30 bg-stone/60 px-3 py-2">
              <span className="block font-mono text-[0.56rem] tracking-[0.12em] text-taupe uppercase">{offer.label}</span>
              <span className="block text-[0.95rem] leading-snug font-semibold">{offer.text}</span>
            </p>
          </div>
        </Fold>
      )}

      <Fold open={step >= 4}>
        <div className="mt-3 border-t-2 border-dashed border-graphite/25 px-4 pt-3 pb-4">
          {stub}
          {foot && <div className="mt-3 space-y-1.5 text-[0.68rem] leading-snug text-graphite/70">{foot}</div>}
        </div>
      </Fold>
    </article>
  );
}
