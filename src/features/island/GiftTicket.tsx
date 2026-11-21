"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Gift as GiftIcon, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { content, giftMilestones, nextGift, unlockSteps, type GiftState } from "./content";
import type { Gift } from "./gifts";
import type { IslandHandle } from "./IslandScene";

const MARGIN = 12;
const TOP_MIN = 76; // keep clear of the nav
const GAP = 22; // below the gift

type Props = {
  gift: Gift;
  /** Which cloud's gift this is (0-based). */
  index: number;
  state: GiftState;
  /** Journey steps on the island now. Null when the server could not be reached: nothing is claimed about progress. */
  known: number | null;
  handle: React.RefObject<IslandHandle | null>;
  onClose: () => void;
};

/**
 * One small paper ticket next to the gift in the sky: the offer on one side, your journey on the other, so you can see
 * what you have and what opens next. It follows the gift if the camera moves and never leaves the island:
 * closing it (button, Esc) returns straight to the same view. Demo gifts are labelled, and their code works nowhere.
 */
export function GiftTicket({ gift, index, state, known, handle, onClose }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const tail = useRef<HTMLSpanElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [shown, setShown] = useState(false);
  const [revealed, setRevealed] = useState(false);

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
        h.giftScreen(index, out);
        const w = el.offsetWidth;
        const ht = el.offsetHeight;
        const left = Math.min(Math.max(out.x - w / 2, MARGIN), Math.max(MARGIN, parent.clientWidth - w - MARGIN));
        const top = Math.min(Math.max(out.y + GAP, TOP_MIN), Math.max(TOP_MIN, parent.clientHeight - ht - MARGIN));
        el.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
        if (tail.current) {
          tail.current.style.left = `${Math.min(Math.max(out.x - left - 6, 14), w - 26)}px`;
          tail.current.style.display = out.y + GAP >= TOP_MIN ? "block" : "none";
        }
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [handle, index]);

  const g = content.gift;
  const locked = state === "locked";
  const need = known === null ? null : Math.max(0, giftMilestones[index] - known);
  const rows: [string, string][] = [
    [g.merchant, gift.merchant],
    [g.benefit, gift.benefit],
    [g.expires, gift.expires],
    [g.conditions, gift.conditions],
    [g.status, gift.status],
    ...(gift.instructions ? ([["How to redeem", gift.instructions]] as [string, string][]) : []),
  ];

  return (
    <div ref={box} className="pointer-events-none absolute top-0 left-0 z-20 w-[min(35rem,calc(100%-1.5rem))] will-change-transform">
      <div
        role="dialog"
        aria-label={g.title}
        className={cn(
          "pointer-events-auto relative max-h-[calc(100svh-6.5rem)] overflow-y-auto rounded-2xl border border-hairline bg-ivory font-ui text-graphite shadow-float transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none",
          shown ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
        )}
      >
        <div className="grid gap-0 sm:grid-cols-[1.15fr_1fr]">
          {/* The offer */}
          <section className="p-4">
            <p className="font-mono text-[0.6rem] tracking-[0.14em] text-cat-station uppercase">{gift.demo ? g.kicker : g.realKicker}</p>
            <h2 className="mt-1 font-serif text-xl leading-tight font-semibold">{g.title}</h2>
            <p className="text-sm text-taupe">{g.subtitle}</p>

            {locked ? (
              <p className="mt-3 flex items-start gap-2 border-t border-dashed border-graphite/20 pt-3 text-sm">
                <Lock className="mt-0.5 size-4 shrink-0 text-taupe" aria-hidden />
                <span>{need === null ? content.journey.unknown : g.locked(need)}</span>
              </p>
            ) : (
              <>
                <dl className="mt-3 space-y-2 border-t border-dashed border-graphite/20 pt-3 text-[0.8rem] leading-snug">
                  {rows.map(([label, value]) => (
                    <div key={label}>
                      <dt className="font-mono text-[0.58rem] tracking-[0.12em] text-taupe uppercase">{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                  <div>
                    <dt className="font-mono text-[0.58rem] tracking-[0.12em] text-taupe uppercase">{g.code}</dt>
                    <dd>
                      {revealed ? (
                        <span className="inline-block rounded-lg border border-dashed border-graphite/40 bg-stone px-2.5 py-1 font-mono text-sm tracking-wider">
                          {gift.code}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRevealed(true)}
                          className="inline-flex h-8 cursor-pointer items-center rounded-full border border-graphite/30 px-3 text-xs font-medium outline-none hover:border-graphite/60 focus-visible:ring-4 focus-visible:ring-graphite/20"
                        >
                          {g.reveal}
                        </button>
                      )}
                      {revealed && gift.demo && <span className="mt-1 block text-[0.7rem] text-taupe">{g.codeNote}</span>}
                    </dd>
                  </div>
                </dl>
              </>
            )}

            <button
              ref={closeBtn}
              type="button"
              onClick={onClose}
              className="mt-4 inline-flex h-9 cursor-pointer items-center rounded-full bg-graphite px-4 text-xs font-medium text-ivory outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25"
            >
              {g.close}
            </button>
          </section>

          {/* The journey */}
          <Journey known={known} highlight={index} />
        </div>
        {/* a small tab pointing up at the gift */}
        <span ref={tail} aria-hidden className="absolute -top-1.5 size-3 rotate-45 border-t border-l border-hairline bg-ivory" />
      </div>
    </div>
  );
}

/** Where you are on the island's journey, and when the next gift opens. Nothing is claimed if progress is unknown. */
function Journey({ known, highlight }: { known: number | null; highlight: number }) {
  const j = content.journey;
  const total = unlockSteps.length;
  const next = known === null ? null : nextGift(known);
  const giftAt = (step: number) => giftMilestones.findIndex((m) => m === step);

  return (
    <section className="border-t border-dashed border-graphite/20 bg-stone/50 p-4 sm:border-t-0 sm:border-l">
      <h3 className="font-serif text-base font-semibold">{j.title}</h3>
      <p className="mt-0.5 text-xs text-taupe">
        {known === null ? j.unknown : j.summary(known, total)}
        {known !== null && (next ? <span className="block font-medium text-graphite">{j.next(next.need)}</span> : <span className="block font-medium text-graphite">{j.allGifts}</span>)}
      </p>

      <ol className="mt-3 max-h-60 space-y-1.5 overflow-y-auto pr-1 text-xs sm:max-h-[17rem]">
        <Row done label={j.start} gift={giftAt(0)} highlight={highlight} known={known} />
        {unlockSteps.map((step, i) => (
          <Row key={step.name} done={known !== null && i < known} current={known !== null && i === known} label={step.name} gift={giftAt(i + 1)} highlight={highlight} known={known} />
        ))}
      </ol>
      {known !== null && known >= total && <p className="mt-2 text-[0.68rem] text-taupe">{j.more}</p>}
    </section>
  );
}

function Row({ done, current, label, gift, highlight, known }: { done?: boolean; current?: boolean; label: string; gift: number; highlight: number; known: number | null }) {
  return (
    <li className={cn("flex items-start gap-2", !done && !current && "text-taupe")}>
      <span
        aria-hidden
        className={cn(
          "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border",
          done ? "border-cat-verify bg-cat-verify text-ivory" : current ? "border-graphite" : "border-dashed border-graphite/30",
        )}
      >
        {done && <Check className="size-2.5" />}
      </span>
      <span className={cn("min-w-0 flex-1", current && "font-medium text-graphite")}>
        {label}
        {gift >= 0 && (
          <span
            className={cn(
              "ml-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.62rem] font-medium",
              known !== null && giftMilestones[gift] <= known ? "bg-cat-verify/10 text-cat-verify" : "bg-graphite/8 text-taupe",
              gift === highlight && "ring-1 ring-graphite/40",
            )}
          >
            <GiftIcon className="size-2.5" aria-hidden /> {content.journey.gift(gift + 1)}
          </span>
        )}
      </span>
    </li>
  );
}
