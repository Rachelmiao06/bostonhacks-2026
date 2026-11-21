"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowLeft, LoaderCircle, LocateFixed, Search } from "lucide-react";
import stationData from "@/lib/data/stations.json";
import { cn } from "@/lib/utils";
import { dive } from "./content";
import { prefersReducedMotion } from "./world";
import { AtlasButton } from "./ui";

export type LoadStatus = { streets: boolean; lines: boolean; problems: boolean; failed?: boolean };
export type GatePhase = "gate" | "locating" | "waiting" | "revealing";
export type LocateError = "denied" | "system" | "unavailable" | "timeout" | "unsupported";

type Props = {
  phase: GatePhase;
  status: LoadStatus;
  /** Why the browser would not share a location, if it would not. */
  error: LocateError | null;
  onLocate: () => void;
  onSpot: (stationId: string) => void;
  onSkip: () => void;
  /** Called when the exit animation has finished and the gate can be removed. */
  onGone: () => void;
};

const stationList = (stationData.stations as { id: string; name: string; lines: string[] }[])
  .map((s) => ({ id: s.id, name: s.name, lines: s.lines }))
  .sort((a, b) => a.name.localeCompare(b.name));

/**
 * The welcome: a small frosted-glass card floating over the live map, low in the corner on wide screens and
 * as a bottom sheet on phones. The map loads behind it and stays visible. Three honest choices, location
 * optional. When the camera starts to move, the card fades away.
 */
export function DiveGate({ phase, status, error, onLocate, onSpot, onSkip, onGone }: Props) {
  const card = useRef<HTMLDivElement>(null);
  const sheen = useRef<HTMLSpanElement>(null);
  // Real refraction (the map bends a little behind the glass) where the browser can filter a backdrop; a plain frosted blur elsewhere.
  const [refract] = useState(() => typeof CSS !== "undefined" && CSS.supports("backdrop-filter", "url(#tp-liquid)"));
  const [choosing, setChoosing] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (prefersReducedMotion()) return;
    // The card settles like a drop of glass: it rises, grows a touch and sharpens out of a blur, then one soft glint crosses it.
    const tween = gsap.fromTo(
      card.current,
      { y: 22, scale: 0.94, opacity: 0, filter: "blur(10px)" },
      { y: 0, scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.9, ease: "power3.out", clearProps: "transform,opacity,filter" },
    );
    const glint = gsap.fromTo(sheen.current, { xPercent: -130 }, { xPercent: 130, duration: 1.5, delay: 0.45, ease: "power2.inOut" });
    return () => {
      tween.kill();
      glint.kill();
    };
  }, []);

  useEffect(() => {
    if (phase !== "revealing") return;
    if (prefersReducedMotion()) {
      onGone();
      return;
    }
    const tween = gsap.to(card.current, { y: 12, opacity: 0, duration: 0.4, ease: "power2.in", onComplete: onGone });
    return () => {
      tween.kill();
    };
  }, [phase, onGone]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? stationList.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 12) : [];
  }, [query]);

  const busy = phase !== "gate";
  const ready = [status.streets, status.lines, status.problems].filter(Boolean).length;
  const note = status.failed ? dive.failed : error ? dive.errors[error] : phase === "waiting" && ready < 3 ? dive.waiting : "";

  return (
    <div className="pointer-events-none fixed inset-0 z-[35] flex items-end justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:justify-start sm:px-6 sm:pb-6">
      <div
        ref={card}
        role="region"
        aria-label={dive.title}
        className={cn(
          "pointer-events-auto relative isolate w-full max-w-[24rem] overflow-hidden rounded-[1.75rem] border border-ivory/80 bg-gradient-to-br from-ivory/55 via-ivory/30 to-ivory/18 p-4 font-ui text-graphite backdrop-blur-xl backdrop-saturate-[1.8] sm:p-5",
          phase === "revealing" && "pointer-events-none",
        )}
        style={{
          // Rim light on the top edge, a soft inner glow, and a long shadow that lifts the glass off the map.
          boxShadow:
            "inset 0 1.5px 0 var(--ivory), inset 0 -1px 0 color-mix(in oklab, var(--ivory) 40%, transparent), inset 0 0 24px color-mix(in oklab, var(--ivory) 35%, transparent), 0 24px 48px -20px color-mix(in oklab, var(--graphite) 38%, transparent), 0 2px 6px color-mix(in oklab, var(--graphite) 10%, transparent)",
          ...(refract ? { backdropFilter: "blur(5px) saturate(1.9) brightness(1.04) url(#tp-liquid)" } : {}),
        }}
      >
        <svg aria-hidden width="0" height="0" className="absolute">
          <filter id="tp-liquid" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.005 0.009" numOctaves="2" seed="7" result="warp" />
            <feDisplacementMap in="SourceGraphic" in2="warp" scale="56" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        {/* highlights: a bright bloom in the top-left corner and a glint that crosses once on arrival */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit]"
          style={{ background: "radial-gradient(120% 90% at 8% 0%, color-mix(in oklab, var(--ivory) 85%, transparent), transparent 55%)" }}
        />
        <span
          ref={sheen}
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 -z-10 w-2/3 -skew-x-12"
          style={{ background: "linear-gradient(90deg, transparent, color-mix(in oklab, var(--ivory) 70%, transparent), transparent)", transform: "translateX(-130%)" }}
        />
        <p className="font-mono text-[0.62rem] tracking-[0.14em] text-taupe uppercase">{dive.eyebrow}</p>
        <h2 className="mt-1 font-serif text-2xl leading-tight font-semibold tracking-tight">{dive.title}</h2>
        <p className="mt-1 text-sm text-taupe">{dive.intro}</p>

        {/* A ticket's tear line */}
        <div aria-hidden className="my-3.5 border-t border-dashed border-graphite/25" />

        {choosing ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[0.62rem] tracking-[0.14em] text-taupe uppercase">{dive.pickTitle}</p>
              <button
                type="button"
                onClick={() => {
                  setChoosing(false);
                  setQuery("");
                }}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full px-1.5 py-0.5 text-xs text-taupe outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/30"
              >
                <ArrowLeft className="size-3" aria-hidden />
                {dive.back}
              </button>
            </div>
            <label className="relative block">
              <span className="sr-only">{dive.search}</span>
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-taupe" />
              <input
                // On a phone the keyboard would cover the map, so only wide screens focus the box for you.
                autoFocus={window.matchMedia("(min-width: 640px)").matches}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={dive.search}
                className="h-10 w-full rounded-full border border-graphite/20 bg-ivory/80 pr-3 pl-9 text-sm text-graphite outline-none placeholder:text-taupe/80 focus-visible:border-graphite/50 focus-visible:ring-4 focus-visible:ring-graphite/10"
              />
            </label>
            {query.trim() ? (
              <ul className="max-h-44 space-y-0.5 overflow-y-auto overscroll-contain" aria-label={dive.pickTitle}>
                {matches.length === 0 && <li className="px-2 py-2 text-sm text-taupe">{dive.noMatch}</li>}
                {matches.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onSpot(s.id)}
                      className="flex w-full cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-left text-sm outline-none hover:bg-stone-deep/50 focus-visible:ring-2 focus-visible:ring-graphite/30 disabled:opacity-40"
                    >
                      {s.name}
                      <span className="text-xs text-taupe">{s.lines.join(" · ")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs text-taupe">{dive.popular}</p>
                <div className="flex flex-wrap gap-1.5">
                  {dive.spots.map((spot) => (
                    <AtlasButton key={spot.stationId} tone="outline" size="sm" disabled={busy} onClick={() => onSpot(spot.stationId)}>
                      {spot.label}
                    </AtlasButton>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <AtlasButton size="lg" className="w-full" disabled={busy} onClick={onLocate}>
              {phase === "locating" ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <LocateFixed className="size-4" aria-hidden />}
              {phase === "locating" ? dive.locating : dive.useLocation}
            </AtlasButton>
            <AtlasButton tone="outline" size="lg" className="w-full bg-ivory/40" disabled={busy} onClick={() => setChoosing(true)}>
              {dive.chooseStation}
            </AtlasButton>
            <button
              type="button"
              disabled={busy}
              onClick={onSkip}
              className="block w-full cursor-pointer rounded-full py-1.5 text-center text-sm text-taupe underline decoration-graphite/25 underline-offset-4 outline-none hover:text-graphite focus-visible:ring-4 focus-visible:ring-graphite/25 disabled:opacity-40"
            >
              {dive.skip}
            </button>
          </div>
        )}

        <p role="status" className={cn("text-xs leading-snug", note ? "mt-2.5" : "hidden", error ? "font-medium text-cat-service" : "text-taupe")}>
          {note}
        </p>
      </div>
    </div>
  );
}
