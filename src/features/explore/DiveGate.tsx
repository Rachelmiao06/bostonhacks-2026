"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Check, LoaderCircle, LocateFixed } from "lucide-react";
import { PixelTrain } from "@/components/shared/pixel-train";
import { cn } from "@/lib/utils";
import { dive } from "./content";
import { prefersReducedMotion } from "./world";
import { AtlasButton, Eyebrow } from "./ui";

export type LoadStatus = {
  streets: boolean;
  lines: boolean;
  problems: boolean;
};
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
 * The first screen. It is in the first download on purpose: the map is big, so we show something
 * useful at once, let the rider choose how to start, and load the map behind it. When the map is
 * ready the gate lifts away like a cloud while the camera starts to fall toward the rider's stop.
 */
export function DiveGate({ phase, status, denied, onLocate, onSpot, onSkip, onGone }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const train = useRef<HTMLDivElement>(null);

  // Entrance: the lines of the screen settle in one after another; the train rolls along its track.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-rise]", {
        y: 18,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.09,
      });
      gsap.fromTo(train.current, { xPercent: -140 }, { xPercent: 0, duration: 1.6, ease: "power2.out", delay: 0.2 });
    }, root);
    return () => ctx.revert();
  }, []);

  // Exit: the gate swells toward the rider and thins out, as if we are passing through a cloud.
  useEffect(() => {
    if (phase !== "revealing") return;
    if (prefersReducedMotion()) {
      onGone();
      return;
    }
    const tween = gsap.to(root.current, {
      opacity: 0,
      duration: 1.1,
      ease: "power2.in",
      onComplete: onGone,
    });
    const lift = gsap.to(content.current, {
      scale: 1.25,
      y: -30,
      duration: 1.1,
      ease: "power2.in",
    });
    return () => {
      tween.kill();
      lift.kill();
    };
  }, [phase, onGone]);

  const busy = phase !== "gate";
  const allReady = status.streets && status.lines && status.problems;

  return (
    <div
      ref={root}
      className={cn("fixed inset-0 z-[35] overflow-y-auto bg-stone text-graphite", phase === "revealing" && "pointer-events-none")}
      style={{
        backgroundImage: "radial-gradient(circle at 50% 38%, var(--ivory), transparent 60%)",
      }}
    >
      <div ref={content} className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 px-6 pt-24 pb-12 text-center font-ui">
        <div data-rise>
          <Eyebrow>{dive.eyebrow}</Eyebrow>
        </div>
        <h2 data-rise className="font-serif text-[2.6rem] leading-[1.05] font-semibold tracking-tight sm:text-6xl">
          {dive.title}
        </h2>
        <p data-rise className="max-w-md text-base leading-relaxed text-taupe">
          {dive.intro}
        </p>

        <div data-rise className="flex w-full flex-col items-center gap-3">
          <AtlasButton size="lg" className="h-14 px-7 text-base" disabled={busy} onClick={onLocate}>
            {phase === "locating" ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : <LocateFixed className="size-5" aria-hidden />}
            {phase === "locating" ? dive.locating : dive.useLocation}
          </AtlasButton>
          <p role="status" className={cn("min-h-5 text-sm", denied ? "font-medium text-cat-service" : "text-taupe")}>
            {denied ? dive.denied : phase === "waiting" ? (allReady ? "" : dive.waiting) : ""}
          </p>
        </div>

        <div data-rise className="space-y-2.5">
          <Eyebrow>{dive.orStart}</Eyebrow>
          <div className="flex flex-wrap justify-center gap-2">
            {dive.spots.map((spot) => (
              <AtlasButton key={spot.stationId} tone="outline" size="sm" disabled={busy} onClick={() => onSpot(spot.stationId)}>
                {spot.label}
              </AtlasButton>
            ))}
          </div>
        </div>

        <button
          data-rise
          type="button"
          disabled={busy}
          onClick={onSkip}
          className="cursor-pointer text-sm text-taupe underline decoration-graphite/25 underline-offset-4 outline-none hover:text-graphite focus-visible:ring-4 focus-visible:ring-graphite/25 disabled:opacity-40"
        >
          {dive.skip}
        </button>

        {/* Honest loading: what is ready, so waiting never feels like nothing is happening. */}
        <ul
          data-rise
          aria-label={dive.loading.label}
          className="flex flex-wrap justify-center gap-x-4 gap-y-1 font-mono text-[0.65rem] tracking-wide text-taupe uppercase"
        >
          {(["streets", "lines", "problems"] as const).map((key) => (
            <li key={key} className="inline-flex items-center gap-1.5">
              {status[key] ? (
                <Check className="size-3 text-cat-verify" strokeWidth={3} aria-hidden />
              ) : (
                <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-taupe/60" />
              )}
              {dive.loading[key]}
              <span className="sr-only">{status[key] ? " ready" : " loading"}</span>
            </li>
          ))}
        </ul>

        {/* A little track along the bottom for the pixel train to roll in on. */}
        <div aria-hidden className="relative mt-2 h-12 w-full overflow-hidden">
          <span className="absolute inset-x-0 bottom-3 border-t-2 border-dashed border-graphite/20" />
          <div ref={train} className="absolute bottom-3 left-[calc(50%-44px)]">
            <PixelTrain size={88} body="fill-cat-service" />
          </div>
        </div>
      </div>
    </div>
  );
}
