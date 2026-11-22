"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, MapPin, Sparkles, TrainFront, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { categories } from "@/features/explore/content";
import { categoryStyle } from "@/features/explore/category";
import { glassClass, glassStyle, primaryClass, primaryStyle } from "@/features/explore/glass";
import { hasSeen } from "@/features/explore/onboarding";
import { coach } from "./content";
import { coachMarkSeen, coachReset, coachSeen } from "./storage";
import { TrolleyHero } from "./TrolleyHero";

type Phase = "idle" | "intro" | "waiting" | "live";

/** Fired by anything (a button, Trolley) to replay the coach: `window.dispatchEvent(new Event("tada:coach:start"))`. */
export const COACH_START_EVENT = "tada:coach:start";

/** Text on screen while the map is still zooming to the rider's start; the live guide waits until none of it is showing. */
const BUSY_TEXT = ["Where should we start?", "Finding problems near you", "Almost there", "Finding the nearest stop"];

/**
 * The first-visit coach, spread over the first minute instead of one big tour:
 *  1. a punchy card that says what Tada is and its three features, before anything else;
 *  2. the normal welcome, where the rider picks a start and the map zooms to it;
 *  3. four short tips that pop up one at a time like notifications, each beside the thing it explains
 *     (the pins, the problem kinds, My World, Trolley), then go away.
 * It never blocks the map. Escape or "Skip tips" ends it for good.
 */
export function CoachTour() {
  const [phase, setPhase] = useState<Phase>("idle");

  // Decide what to show, once, in the browser.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tour") === "1") coachReset();
    const t = window.setTimeout(() => {
      if (!coachSeen("intro")) setPhase("intro");
      else if (!coachSeen("tour")) setPhase("waiting");
    }, 600);
    const onStart = () => {
      coachReset();
      setPhase("intro");
    };
    window.addEventListener(COACH_START_EVENT, onStart);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener(COACH_START_EVENT, onStart);
    };
  }, []);

  // After the intro: wait until the rider has picked a start, the map has finished zooming and the welcome is gone.
  useEffect(() => {
    if (phase !== "waiting") return;
    let quiet = 0;
    const id = window.setInterval(() => {
      const busy = BUSY_TEXT.some((s) => document.body.innerText.includes(s));
      quiet = hasSeen("welcomed") && !busy ? quiet + 1 : 0;
      if (quiet >= 4) {
        window.clearInterval(id);
        setPhase("live");
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [phase]);

  const endIntro = useCallback(() => {
    coachMarkSeen("intro");
    setPhase("waiting");
  }, []);
  const endLive = useCallback(() => {
    coachMarkSeen("intro");
    coachMarkSeen("tour");
    setPhase("idle");
  }, []);

  useEffect(() => {
    if (phase !== "intro" && phase !== "live") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (phase === "intro") endIntro();
      else endLive();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, endIntro, endLive]);

  if (phase === "intro") return <Intro onStart={endIntro} />;
  if (phase === "live") return <Tips onDone={endLive} />;
  return null;
}

/* ---------- 1. What is Tada ---------- */

const featureIcon: Record<string, LucideIcon> = { explore: MapPin, report: Camera, world: Sparkles };

function Intro({ onStart }: { onStart: () => void }) {
  const primary = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    primary.current?.focus();
  }, []);
  const t = coach.intro;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite/35 p-4 backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coach-intro-title"
        className="w-full max-w-md rounded-3xl border border-ivory/80 bg-ivory/95 p-5 font-ui text-graphite shadow-float backdrop-blur-xl motion-safe:animate-in motion-safe:zoom-in-95"
      >
        <TrolleyHero />
        <p className="mt-4 font-mono text-[0.65rem] tracking-[0.14em] text-taupe uppercase">{t.eyebrow}</p>
        <h2 id="coach-intro-title" className="mt-1 font-heading text-3xl leading-[1.05] font-semibold">{t.title}</h2>
        <p className="mt-2 text-sm leading-snug text-graphite/90">{t.body}</p>
        <ul className="mt-3 space-y-2">
          {t.features.map((f) => {
            const Icon = featureIcon[f.id];
            return (
              <li key={f.id} className="flex items-start gap-3 rounded-2xl border border-hairline bg-ivory/80 p-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cat-verify/15">
                  <Icon className="size-4 text-cat-verify" aria-hidden />
                </span>
                <span className="text-sm leading-snug">
                  <span className="font-heading font-semibold">{f.label}.</span> <span className="text-taupe">{f.text}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[0.7rem] leading-snug text-taupe">{t.honest}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
          <button ref={primary} type="button" onClick={onStart} className={`${primaryClass} h-11 px-6 text-sm sm:flex-1`} style={primaryStyle}>
            {t.start}
          </button>
          <button type="button" onClick={onStart} className={`${glassClass} h-11 px-5 text-sm`} style={glassStyle}>
            {t.skip}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- 3. The tips ---------- */

type Tip = (typeof coach.tips)[number];
const GAP_MS = 700; // empty pause between two tips
const LEAVE_MS = 350;
const TIP_W = 288;

/** Where a measured element sits on screen (or null if it is not there), re-read on resize. */
function useRect(selector: string | undefined) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!selector) return;
    const read = () => setRect(document.querySelector(selector)?.getBoundingClientRect() ?? null);
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, [selector]);
  return rect;
}

const anchorSelector = { world: 'header a[href="/world"]', trolley: 'button[aria-label="Open Trolley chat"]' } as const;

function Tips({ onDone }: { onDone: () => void }) {
  const tips = coach.tips;
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (index >= tips.length) {
      onDone();
      return;
    }
    const enter = index === 0 ? 700 : GAP_MS;
    let leave = 0;
    let next = 0;
    const show = window.setTimeout(() => {
      setLeaving(false);
      leave = window.setTimeout(() => setLeaving(true), tips[index].ms - LEAVE_MS);
      next = window.setTimeout(() => setIndex(index + 1), tips[index].ms);
    }, enter);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(leave);
      window.clearTimeout(next);
    };
  }, [index, tips, onDone]);

  // The tip is only on screen between its own timers; before that (the pause) nothing shows.
  const [shownIndex, setShownIndex] = useState(-1);
  useEffect(() => {
    const id = window.setTimeout(() => setShownIndex(index), index === 0 ? 700 : GAP_MS);
    return () => window.clearTimeout(id);
  }, [index]);
  const tip = shownIndex === index ? tips[index] : undefined;

  return (
    <>
      {tip && <TipCard key={tip.id} tip={tip} leaving={leaving} />}
      <button
        type="button"
        onClick={onDone}
        className="fixed bottom-3 left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-full border border-ivory/80 bg-ivory/90 px-3 py-1 font-ui text-xs text-taupe shadow-float backdrop-blur-xl outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/30"
      >
        {coach.skip}
      </button>
    </>
  );
}

const tipIcon: Record<string, LucideIcon> = { pin: MapPin, kinds: MapPin, world: Sparkles, trolley: TrainFront };

function TipCard({ tip, leaving }: { tip: Tip; leaving: boolean }) {
  const selector = tip.place === "world" || tip.place === "trolley" ? anchorSelector[tip.place] : undefined;
  const rect = useRect(selector);
  const Icon = tipIcon[tip.id];

  // Fixed corners for the two tips that explain the map as a whole; the other two point at their own button.
  let style: React.CSSProperties = {};
  let cls = "";
  let tail: { side: "top" | "bottom"; left: number } | null = null;
  if (tip.place === "right") cls = "top-[9.5rem] right-2 sm:top-[7.75rem] sm:right-4";
  else if (tip.place === "left") cls = "top-[9.5rem] left-2 sm:top-[8.75rem] sm:left-4";
  else if (rect) {
    const w = Math.min(TIP_W, window.innerWidth - 16);
    const cx = rect.left + rect.width / 2;
    const left = Math.min(Math.max(cx - w + 40, 8), window.innerWidth - w - 8);
    if (tip.place === "world") style = { top: rect.bottom + 12, left };
    else style = { bottom: window.innerHeight - rect.top + 12, left };
    tail = { side: tip.place === "world" ? "top" : "bottom", left: Math.min(Math.max(cx - left - 6, 14), w - 26) };
  } else cls = tip.place === "world" ? "top-[9.5rem] right-2 sm:right-4" : "bottom-20 right-2 sm:right-4";

  return (
    <div
      role="status"
      style={style}
      className={cn(
        "pointer-events-none fixed z-50 w-[min(18rem,calc(100vw-1rem))] rounded-2xl border border-ivory/80 bg-ivory/95 p-3 font-ui text-graphite shadow-float backdrop-blur-xl duration-300",
        leaving ? "motion-safe:animate-out motion-safe:fade-out motion-safe:zoom-out-95" : "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:slide-in-from-top-2",
        cls,
      )}
    >
      <div className="flex gap-2.5">
        <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cat-verify">
          <Icon className="size-4 text-ivory" />
        </span>
        <div className="min-w-0 text-xs leading-snug">
          <p className="font-heading text-sm font-semibold">{tip.title}</p>
          {tip.text && <p className="mt-0.5 text-taupe">{tip.text}</p>}
        </div>
      </div>
      {tip.id === "kinds" && (
        <ul className="mt-2.5 space-y-1.5">
          {categories.map((c) => {
            const st = categoryStyle[c.id];
            const KindIcon = st.icon;
            return (
              <li key={c.id} className="flex items-start gap-2 text-xs leading-snug">
                <span className={cn("mt-px flex size-5 shrink-0 items-center justify-center rounded-full", st.soft)}>
                  <KindIcon className={cn("size-3", st.text)} aria-hidden />
                </span>
                <span>
                  <span className="font-semibold">{c.label}.</span> <span className="text-taupe">{coach.kinds[c.id]}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {tail && (
        <span
          aria-hidden
          style={{ left: tail.left }}
          className={cn("absolute size-3 rotate-45 border-ivory/80 bg-ivory", tail.side === "top" ? "-top-1.5 border-t border-l" : "-bottom-1.5 border-r border-b")}
        />
      )}
    </div>
  );
}
