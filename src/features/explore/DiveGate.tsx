"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { LoaderCircle, LocateFixed } from "lucide-react";
import { cn } from "@/lib/utils";
import { dive } from "./content";
import { prefersReducedMotion } from "./world";
import { AtlasButton } from "./ui";

export type LoadStatus = { streets: boolean; lines: boolean; problems: boolean; failed?: boolean };
export type GatePhase = "gate" | "locating" | "waiting" | "revealing";

type Props = {
  phase: GatePhase;
  status: LoadStatus;
  /** Shown when the browser would not share a location. */
  denied: boolean;
  onLocate: () => void;
  onSpot: (stationId: string) => void;
  onSkip: () => void;
  /** Called when the exit animation has finished and the gate can be removed. */
  onGone: () => void;
};

/**
 * A small invitation over the map, not a page of its own. The map loads behind it and stays visible;
 * the rider picks how to start (or just ignores the card and uses the map). When the camera starts to
 * fall, the card slips away.
 */
export function DiveGate({ phase, status, denied, onLocate, onSpot, onSkip, onGone }: Props) {
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const tween = gsap.fromTo(card.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", clearProps: "transform,opacity" });
    return () => {
      tween.kill();
    };
  }, []);

  useEffect(() => {
    if (phase !== "revealing") return;
    if (prefersReducedMotion()) {
      onGone();
      return;
    }
    const tween = gsap.to(card.current, { y: 28, opacity: 0, duration: 0.45, ease: "power2.in", onComplete: onGone });
    return () => {
      tween.kill();
    };
  }, [phase, onGone]);

  const busy = phase !== "gate";
  const ready = [status.streets, status.lines, status.problems].filter(Boolean).length;

  return (
    <div className="pointer-events-none fixed inset-0 z-[35] flex items-end justify-center p-3 pb-4 sm:pb-8">
      <div
        ref={card}
        role="region"
        aria-label={dive.title}
        className={cn(
          "pointer-events-auto w-full max-w-md space-y-3 rounded-2xl border border-hairline bg-ivory/95 p-4 sm:space-y-4 sm:p-5 text-graphite shadow-ticket backdrop-blur-md",
          "font-ui",
          phase === "revealing" && "pointer-events-none",
        )}
      >
        <div className="space-y-2">
          <p className="font-mono text-[0.62rem] tracking-[0.14em] text-taupe uppercase">{dive.eyebrow}</p>
          <p className="text-sm font-medium text-graphite">{dive.pitch}</p>
          <ol className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-taupe">
            {dive.steps.map((step, i) => (
              <li key={step} className="inline-flex items-center gap-1.5">
                <span aria-hidden className="grid size-4 place-items-center rounded-full bg-stone-deep font-mono text-[0.6rem] text-graphite">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-1 border-t border-hairline pt-3">
          <h2 className="font-serif text-xl leading-tight sm:text-2xl font-semibold tracking-tight">{dive.title}</h2>
          <p className="text-sm text-taupe">{dive.intro}</p>
        </div>
        <div className="space-y-2">
          <AtlasButton size="lg" className="w-full" disabled={busy} onClick={onLocate}>
            {phase === "locating" ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <LocateFixed className="size-4" aria-hidden />}
            {phase === "locating" ? dive.locating : dive.useLocation}
          </AtlasButton>
          <p role="status" className={cn("min-h-4 text-xs", denied ? "font-medium text-cat-service" : "text-taupe")}>
            {denied ? dive.denied : phase === "waiting" && ready < 3 ? dive.waiting : ""}
          </p>
        </div>

        <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]">
          <span className="mr-1 shrink-0 font-mono text-[0.62rem] tracking-[0.14em] text-taupe uppercase">{dive.orStart}</span>
          {dive.spots.map((spot) => (
            <AtlasButton key={spot.stationId} tone="outline" size="sm" className="shrink-0" disabled={busy} onClick={() => onSpot(spot.stationId)}>
              {spot.label}
            </AtlasButton>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-hairline pt-3 text-xs text-taupe">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className={cn("size-1.5 rounded-full", ready >= 3 ? "bg-cat-verify" : "animate-pulse bg-taupe/60")} />
            {status.failed ? dive.failed : dive.status(ready, 3)}
          </span>
          <AtlasButton tone="outline" size="sm" className="shrink-0" disabled={busy} onClick={onSkip} title={dive.skipHint}>
            {dive.skip}
          </AtlasButton>
        </div>
      </div>
    </div>
  );
}
