"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { content } from "./content";
import { glass } from "./glass";

const steps = content.tour.steps;
const WHEEL_LOCK_MS = 900; // the camera flight takes about 1.7 s; one scroll gesture = one step
const SWIPE_PX = 36;

/**
 * The first-visit tour of My World: one card at the top, one step at a time. The rider sets the pace by scrolling,
 * swiping the card, using the arrow keys or the buttons. The page flies the camera to each part as `step` changes.
 * While it shows, scrolling steps through the tour instead of zooming the scene.
 */
export function Tour({ step, onStep, onSkip, onFinish }: { step: number; onStep: (n: number) => void; onSkip: () => void; onFinish: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const touchY = useRef<number | null>(null);
  const last = steps.length - 1;
  const s = steps[step];

  // Always read the newest step inside the listeners without re-attaching them
  const live = useRef({ step, onStep, onSkip });
  useEffect(() => {
    live.current = { step, onStep, onSkip };
  });

  useEffect(() => {
    const page = root.current?.parentElement;
    if (!page) return;
    let lockedUntil = 0;
    const go = (d: 1 | -1) => {
      const n = live.current.step + d;
      if (n >= 0 && n <= last) live.current.onStep(n);
    };
    const onWheel = (e: WheelEvent) => {
      if (e.target instanceof Element && e.target.closest("[role=dialog]")) return; // the help panel scrolls itself
      e.preventDefault();
      e.stopPropagation(); // keep the scene from zooming under the tour
      if (Math.abs(e.deltaY) < 8 || performance.now() < lockedUntil) return;
      lockedUntil = performance.now() + WHEEL_LOCK_MS;
      go(e.deltaY > 0 ? 1 : -1);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown") go(1);
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
      else if (e.key === "Escape") live.current.onSkip();
      else return;
      e.preventDefault();
    };
    page.addEventListener("wheel", onWheel, { capture: true, passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      page.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("keydown", onKey);
    };
  }, [last]);

  return (
    <div
      ref={root}
      role="region"
      aria-label={content.tour.label}
      onTouchStart={(e) => (touchY.current = e.touches[0].clientY)}
      onTouchEnd={(e) => {
        const from = touchY.current;
        touchY.current = null;
        if (from === null) return;
        const dy = from - e.changedTouches[0].clientY;
        if (Math.abs(dy) < SWIPE_PX) return;
        const n = step + (dy > 0 ? 1 : -1);
        if (n >= 0 && n <= last) onStep(n);
      }}
      className={`pointer-events-auto absolute top-20 left-1/2 z-20 w-[min(23rem,calc(100%-1.5rem))] -translate-x-1/2 touch-none rounded-3xl p-4 font-ui text-graphite ${glass}`}
    >
      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <p className="font-pixel text-[0.55rem] tracking-wide text-taupe uppercase">{s.kicker}</p>
          <div className="flex items-center gap-1.5" role="group" aria-label={content.tour.stepOf(step + 1, steps.length)}>
            {steps.map((x, i) => (
              <button
                key={x.id}
                type="button"
                aria-label={`${content.tour.stepOf(i + 1, steps.length)}: ${x.title}`}
                aria-current={i === step ? "step" : undefined}
                onClick={() => onStep(i)}
                className={`h-2 cursor-pointer rounded-full outline-none transition-all focus-visible:ring-2 focus-visible:ring-graphite/40 ${i === step ? "w-5 bg-graphite" : "w-2 bg-graphite/25 hover:bg-graphite/50"}`}
              />
            ))}
          </div>
        </div>

        <h2 className="mt-1.5 font-serif text-xl leading-tight font-semibold">{s.title}</h2>
        <p role="status" aria-live="polite" className="mt-1 text-sm leading-snug text-taupe">
          {s.body}
        </p>

        <div className="mt-3 flex items-center gap-2">
          {step > 0 && (
            <button type="button" onClick={() => onStep(step - 1)} className={ghost}>
              {content.tour.back}
            </button>
          )}
          {step < last ? (
            <button type="button" onClick={() => onStep(step + 1)} className={solid}>
              {content.tour.next}
            </button>
          ) : (
            <>
              <Link href="/explore" onClick={onFinish} className={solid}>
                {content.tour.openMap}
              </Link>
              <button type="button" onClick={onFinish} className={ghost}>
                {content.tour.finish}
              </button>
            </>
          )}
          {step < last && (
            <button type="button" onClick={onSkip} className="ml-auto cursor-pointer text-[0.72rem] text-taupe underline underline-offset-2 outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/30">
              {content.tour.skip}
            </button>
          )}
        </div>

        {step < last && (
          <p className="mt-2.5 flex items-center justify-center gap-1 text-[0.68rem] text-taupe" aria-hidden>
            <ChevronDown className="size-3.5 motion-safe:animate-bounce" />
            {content.tour.hint}
          </p>
        )}
      </div>
    </div>
  );
}

const solid =
  "inline-flex h-9 cursor-pointer items-center rounded-full bg-graphite px-4 text-xs font-medium text-ivory outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25";
const ghost =
  "inline-flex h-9 cursor-pointer items-center rounded-full border border-graphite/25 px-4 text-xs font-medium outline-none hover:border-graphite/50 focus-visible:ring-4 focus-visible:ring-graphite/20";
