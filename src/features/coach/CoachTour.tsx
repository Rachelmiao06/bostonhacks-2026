"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, MapPin, Sparkles, TrainFront, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { categories } from "@/features/explore/content";
import { categoryStyle } from "@/features/explore/category";
import { primaryClass, primaryStyle } from "@/features/explore/glass";
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
 *  3. notification-style banners at the top right, one at a time, that explain the four kinds of problems and end on
 *     "every pin is a challenge", while a pulsing ring and a flowing dashed line lead the eye to the nearest pin.
 * It never blocks the map. Tapping a pin, the X, or Escape ends it for good.
 */
export function CoachTour() {
  const [phase, setPhase] = useState<Phase>("idle");

  // Decide what to show, once, in the browser.
  useEffect(() => {
    // `/?tour=1` replays everything from the start: the coach AND Explore's welcome (where the rider picks a start).
    // Explore reads its saved state when it loads, so clear it, drop the flag from the address and reload once.
    if (new URLSearchParams(window.location.search).get("tour") === "1") {
      coachReset();
      try {
        window.localStorage.removeItem("tparty.onboarding");
      } catch {
        // storage blocked: nothing to reset
      }
      window.history.replaceState(null, "", window.location.pathname);
      window.location.reload();
      return;
    }
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
  if (phase === "live") return <Feed onDone={endLive} />;
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
        className="w-full max-w-md rounded-3xl bg-ivory/96 px-6 pt-4 pb-5 sm:bg-ivory/78 font-ui text-graphite shadow-float backdrop-blur-xl backdrop-saturate-150 motion-safe:animate-in motion-safe:zoom-in-95"
      >
        <TrolleyHero />
        <p className="mt-3 font-mono text-[0.65rem] tracking-[0.14em] text-taupe uppercase">{t.eyebrow}</p>
        <h2 id="coach-intro-title" className="mt-1 font-heading text-3xl leading-[1.05] font-semibold">{t.title}</h2>
        <p className="mt-2 text-sm leading-snug text-taupe">{t.body}</p>
        <ul className="mt-6 space-y-4">
          {t.features.map((f) => {
            const Icon = featureIcon[f.id];
            return (
              <li key={f.id} className="flex items-start gap-3.5">
                <Icon className="mt-0.5 size-5 shrink-0 text-cat-verify" aria-hidden />
                <span className="text-sm leading-snug">
                  <span className="font-heading font-semibold">{f.label}.</span> <span className="text-taupe">{f.text}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <button ref={primary} type="button" onClick={onStart} className={`${primaryClass} mt-7 h-11 w-full px-6 text-sm`} style={primaryStyle}>
          {t.start}
        </button>
        <button
          type="button"
          onClick={onStart}
          className="mx-auto mt-3 block cursor-pointer text-xs text-taupe underline underline-offset-4 outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/30"
        >
          {t.skip}
        </button>
      </div>
    </div>
  );
}

/* ---------- 3. Notification feed + the nearest pin ---------- */

type Banner = { id: number; kind?: (typeof categories)[number]["id"]; hidden: boolean };
const TOTAL = categories.length + 1; // one banner per problem kind, then the "every pin" banner
const PIN_RE = /: \d+ problems?$|working again|riders? report/;

/** The problem pin nearest the middle of the screen that is on screen and not under the banners or the top bar. */
function findPin(): { x: number; y: number } | null {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const best = [...document.querySelectorAll<HTMLElement>(".maplibregl-marker button[aria-label]")]
    .filter((el) => PIN_RE.test(el.getAttribute("aria-label") ?? ""))
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
    })
    .filter((p) => p.w > 0 && p.x > 40 && p.x < w - 40 && p.y > 130 && p.y < h - 90 && !(p.x > w - 350 && p.y < 420))
    .sort((a, b) => Math.hypot(a.x - w / 2, a.y - h / 2) - Math.hypot(b.x - w / 2, b.y - h / 2))[0];
  return best ? { x: best.x, y: best.y } : null;
}

function Feed({ onDone }: { onDone: () => void }) {
  const f = coach.feed;
  const [banners, setBanners] = useState<Banner[]>([]);
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);
  const finalRef = useRef<HTMLDivElement>(null);
  const [from, setFrom] = useState<{ x: number; y: number } | null>(null);
  const finalShown = banners.length >= TOTAL;

  // Banners arrive one at a time; each kind banner slides away after a while, the last one stays.
  useEffect(() => {
    const timers: number[] = [];
    for (let i = 0; i < TOTAL; i++) {
      timers.push(
        window.setTimeout(() => {
          setBanners((b) => [{ id: i, kind: categories[i]?.id, hidden: false }, ...b]);
          if (i < categories.length) timers.push(window.setTimeout(() => setBanners((b) => b.map((x) => (x.id === i ? { ...x, hidden: true } : x))), f.lingerMs));
        }, f.firstDelayMs + i * f.gapMs),
      );
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [f.firstDelayMs, f.gapMs, f.lingerMs]);

  // Once the last banner is up, keep finding the nearest pin (the map may still be settling) and where the banner is.
  useEffect(() => {
    if (!finalShown) return;
    const read = () => {
      setPin(findPin());
      const r = finalRef.current?.getBoundingClientRect();
      setFrom(r ? { x: r.left + 36, y: r.bottom } : null);
    };
    read();
    const id = window.setInterval(read, 400);
    return () => window.clearInterval(id);
  }, [finalShown]);

  // Tapping a real pin completes the tour (the tap itself still goes through).
  useEffect(() => {
    if (!finalShown) return;
    const onClick = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target.closest(".maplibregl-marker button[aria-label]") : null;
      if (el && PIN_RE.test(el.getAttribute("aria-label") ?? "")) onDone();
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [finalShown, onDone]);

  return (
    <>
      <section aria-label={f.label} aria-live="polite" className="pointer-events-none fixed top-[8.5rem] right-2 z-50 flex w-[min(19rem,calc(100vw-1rem))] flex-col gap-2 sm:top-[7.75rem] sm:right-4 sm:w-80">
        {banners.map((b) => {
          const rank = banners.filter((x) => !x.hidden || x.id === TOTAL - 1).findIndex((x) => x.id === b.id);
          const isFinal = b.id === TOTAL - 1;
          return (
            <Banner key={b.id} banner={b} rank={rank} isFinal={isFinal} hasPin={!!pin} onClose={onDone} boxRef={isFinal ? finalRef : undefined} />
          );
        })}
      </section>
      {finalShown && pin && from && <PinGuide pin={pin} from={from} />}
    </>
  );
}

function Banner({ banner, rank, isFinal, hasPin, onClose, boxRef }: { banner: Banner; rank: number; isFinal: boolean; hasPin: boolean; onClose: () => void; boxRef?: React.Ref<HTMLDivElement> }) {
  const f = coach.feed;
  const kind = banner.kind ? categories.find((c) => c.id === banner.kind) : undefined;
  const st = banner.kind ? categoryStyle[banner.kind] : undefined;
  const Icon = st?.icon ?? TrainFront;
  const title = isFinal ? f.pin.title : kind?.label;
  const text = isFinal ? (hasPin ? f.pin.text : f.pin.textNoPin) : banner.kind ? coach.kinds[banner.kind] : "";
  // Older banners tuck behind the newest one, like a notification stack.
  const depth = banner.hidden ? 3 : Math.min(rank, 3);
  return (
    <div
      ref={boxRef}
      style={{ opacity: banner.hidden ? 0 : [1, 0.88, 0.7, 0][depth], transform: `scale(${[1, 0.97, 0.94, 0.92][depth]})`, transformOrigin: "top right" }}
      className="pointer-events-auto flex items-start gap-3 rounded-[1.4rem] bg-ivory/80 p-3 font-ui text-graphite shadow-float backdrop-blur-xl backdrop-saturate-150 transition-[opacity,transform] duration-500 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-6 motion-safe:duration-500"
    >
      <span aria-hidden className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", st ? st.soft : "bg-cat-verify")}>
        <Icon className={cn("size-[1.15rem]", st ? st.text : "text-ivory")} />
      </span>
      <div className="min-w-0 flex-1 text-xs leading-snug">
        <p className="flex items-center justify-between font-mono text-[0.6rem] tracking-[0.12em] text-taupe uppercase">
          <span>{f.app}</span>
          <span>{f.now}</span>
        </p>
        <p className="mt-0.5 font-heading text-sm leading-tight font-semibold">{title}</p>
        <p className="mt-0.5 text-taupe">{text}</p>
      </div>
      {isFinal && (
        <button type="button" onClick={onClose} aria-label={f.close} className="-mt-1 -mr-1 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-taupe outline-none hover:bg-stone-deep/60 hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/30">
          <X className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}

/** The lead-in to the nearest pin: a ring that pulses around it and dashes that flow from the last banner towards it. */
function PinGuide({ pin, from }: { pin: { x: number; y: number }; from: { x: number; y: number } }) {
  const dx = pin.x - from.x;
  const dy = pin.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const end = { x: pin.x - (dx / len) * 38, y: pin.y - (dy / len) * 38 }; // stop short of the pin so the dashes never cover it
  const ctrl = { x: from.x - Math.min(80, len * 0.25), y: from.y + len * 0.45 };
  const label = coach.feed.pin.tag;
  const below = pin.y < window.innerHeight - 140;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40">
      <style>{`
        @keyframes coach-flow { to { stroke-dashoffset: -28; } }
        @keyframes coach-ping { 0% { transform: scale(.7); opacity: .7; } 70%, 100% { transform: scale(1.7); opacity: 0; } }
        .coach-flow { animation: coach-flow 1.1s linear infinite; }
        .coach-ping { transform-box: fill-box; transform-origin: center; animation: coach-ping 1.8s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) { .coach-flow, .coach-ping { animation: none; } }
      `}</style>
      <svg width="100%" height="100%" className="absolute inset-0">
        <path d={`M${from.x} ${from.y} Q${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`} fill="none" stroke="var(--cat-verify)" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 13" className="coach-flow" />
        <circle cx={pin.x} cy={pin.y} r="30" fill="none" stroke="var(--cat-verify)" strokeWidth="2.5" strokeOpacity=".8" />
        <circle cx={pin.x} cy={pin.y} r="30" fill="none" stroke="var(--cat-verify)" strokeWidth="2" className="coach-ping" />
      </svg>
      <span
        className="absolute rounded-full bg-ivory/90 px-2.5 py-1 font-heading text-xs font-semibold whitespace-nowrap text-graphite shadow-float backdrop-blur-md"
        style={{ left: pin.x, top: below ? pin.y + 36 : pin.y - 62, transform: "translateX(-50%)" }}
      >
        {label}
      </span>
    </div>
  );
}
