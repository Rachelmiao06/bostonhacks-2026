"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Camera, MapPin, Sparkles, TrainFront, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { categories } from "@/features/explore/content";
import { categoryStyle } from "@/features/explore/category";
import { hasSeen } from "@/features/explore/onboarding";
import { coach } from "./content";
import { coachMarkSeen, coachReset, coachSeen } from "./storage";
import { TrolleyHero } from "./TrolleyHero";

type Phase = "idle" | "intro" | "waiting" | "live";

/** Fired by anything (a button, Trolley) to replay the coach: `window.dispatchEvent(new Event("tada:coach:start"))`. */
export const COACH_START_EVENT = "tada:coach:start";

/**
 * Demo mode: every NEW visit (a new tab or window, or the browser reopened) starts like a first visit, from the
 * "Tiny missions for a better T" card. A reload inside the same visit does not start over. Set to false to show
 * the coach only once per browser, as before.
 */
const FRESH_EACH_VISIT = true;
const VISIT_KEY = "tada:visit";

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
    if (FRESH_EACH_VISIT) {
      try {
        if (!window.sessionStorage.getItem(VISIT_KEY)) {
          window.sessionStorage.setItem(VISIT_KEY, "1");
          // Only a browser that has seen it before needs the reset (and the one reload Explore needs to read it).
          if (coachSeen("intro") || coachSeen("tour") || hasSeen("welcomed")) {
            coachReset();
            window.localStorage.removeItem("tparty.onboarding");
            window.location.reload();
            return;
          }
        }
      } catch {
        // storage blocked: fall back to the normal once-per-browser behaviour
      }
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
        {/* The knitted "Tada" bounces (a transparent animated WebP made from the designer GIF). Reduced Motion gets one still frame. */}
        <picture>
          <source media="(prefers-reduced-motion: reduce)" srcSet="/assets/coach/tada-still.webp" />
          <img src="/assets/coach/tada-bounce.webp" alt={t.eyebrow} width={242} height={176} className="pointer-events-none mt-2 h-14 w-auto select-none" />
        </picture>
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
        {/* The button's skin is a green glass pill with a light that sweeps across it (animated WebP); Reduced Motion gets the still skin. The label is real text on top. */}
        <button
          ref={primary}
          type="button"
          onClick={onStart}
          className="mt-7 h-12 w-full cursor-pointer rounded-full bg-[url('/assets/coach/lets-go-skin.webp')] bg-[length:100%_100%] bg-no-repeat px-6 font-heading text-base font-semibold text-ivory [text-shadow:0_1px_1px_color-mix(in_oklab,var(--graphite)_45%,transparent)] outline-none transition-[filter,transform] hover:brightness-105 focus-visible:ring-4 focus-visible:ring-graphite/25 active:scale-[0.99] motion-reduce:bg-[url('/assets/coach/lets-go-skin.png')]"
        >
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

const PIN_RE = /: \d+ problems?$|working again|riders? report/;

/** The problem pin (its marker button) nearest the middle of the screen that is on screen and not under the card or the top bar. */
function findPin(): HTMLElement | null {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const best = [...document.querySelectorAll<HTMLElement>(".maplibregl-marker button[aria-label]")]
    .filter((el) => PIN_RE.test(el.getAttribute("aria-label") ?? ""))
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { el, x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width };
    })
    // not under the top bar, the bottom, or the card (centred, in the upper part of the screen)
    .filter((p) => p.w > 0 && p.x > 40 && p.x < w - 40 && p.y > 130 && p.y < h - 90 && !(Math.abs(p.x - w / 2) < 200 && p.y < 470))
    .sort((a, b) => Math.hypot(a.x - w / 2, a.y - h / 2) - Math.hypot(b.x - w / 2, b.y - h / 2))[0];
  return best?.el ?? null;
}

/**
 * ONE card, centred near the middle of the screen, that shows all four kinds of problem at once (the rows pop in a
 * moment apart so it reads fast but not as a wall) and ends on "every pin is a challenge". The guide then leads from the
 * card to the nearest pin. It stays until a pin is tapped, the X is pressed or Escape is hit.
 */
function Feed({ onDone }: { onDone: () => void }) {
  const f = coach.feed;
  const [shown, setShown] = useState(false);
  // The marker the guide follows. It is chosen once (and again only if that marker leaves the page), so the ring stays on
  // one pin while the rider moves the map; PinGuide then tracks it frame by frame.
  const [pin, setPin] = useState<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setShown(true), f.firstDelayMs);
    return () => window.clearTimeout(t);
  }, [f.firstDelayMs]);

  // Once the card is up, pick the nearest pin (the map may still be settling, so look again until one is found
  // and whenever the chosen marker has been removed from the page).
  useEffect(() => {
    if (!shown) return;
    const pick = () => setPin((cur) => (cur && cur.isConnected ? cur : findPin()));
    pick();
    const id = window.setInterval(pick, 400);
    return () => window.clearInterval(id);
  }, [shown]);

  // Tapping a real pin completes the tour (the tap itself still goes through).
  useEffect(() => {
    if (!shown) return;
    const onClick = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target.closest(".maplibregl-marker button[aria-label]") : null;
      if (el && PIN_RE.test(el.getAttribute("aria-label") ?? "")) onDone();
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [shown, onDone]);

  if (!shown) return null;
  return (
    <>
      <section aria-label={f.label} aria-live="polite" className="pointer-events-none fixed top-[6.5rem] left-1/2 z-50 w-[min(22rem,calc(100vw-1.5rem))] -translate-x-1/2 sm:top-[6rem]">
        <TipCard hasPin={!!pin} onClose={onDone} boxRef={cardRef} />
      </section>
      {pin && <PinGuide pin={pin} boxRef={cardRef} />}
    </>
  );
}

function TipCard({ hasPin, onClose, boxRef }: { hasPin: boolean; onClose: () => void; boxRef: React.Ref<HTMLDivElement> }) {
  const f = coach.feed;
  return (
    <div
      ref={boxRef}
      className="pointer-events-auto rounded-[1.6rem] bg-ivory/85 p-4 font-ui text-graphite shadow-float backdrop-blur-xl backdrop-saturate-150 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:slide-in-from-top-3 motion-safe:duration-500"
    >
      <p className="flex items-center justify-between font-mono text-[0.6rem] tracking-[0.12em] text-taupe uppercase">
        <span>{f.app} · {f.heading}</span>
        <button type="button" onClick={onClose} aria-label={f.close} className="-my-1.5 -mr-1.5 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-taupe outline-none hover:bg-stone-deep/60 hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/30">
          <X className="size-3.5" aria-hidden />
        </button>
      </p>
      <ul className="mt-2.5 space-y-2.5">
        {categories.map((c, i) => {
          const st = categoryStyle[c.id];
          const Icon = st.icon;
          return (
            <li key={c.id} className="flex items-center gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:fill-mode-backwards" style={{ animationDelay: `${150 + i * 90}ms` }}>
              <span aria-hidden className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", st.soft)}>
                <Icon className={cn("size-[1.15rem]", st.text)} />
              </span>
              <span className="min-w-0 text-xs leading-snug">
                <span className="block font-heading text-sm leading-tight font-semibold">{c.label}</span>
                <span className="block text-taupe">{coach.kinds[c.id]}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex items-center gap-3 border-t border-graphite/10 pt-3 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 motion-safe:fill-mode-backwards" style={{ animationDelay: `${150 + categories.length * 90 + 60}ms` }}>
        <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-cat-verify">
          <TrainFront className="size-[1.15rem] text-ivory" />
        </span>
        <span className="min-w-0 text-xs leading-snug">
          <span className="block font-heading text-sm leading-tight font-semibold">{f.pin.title}</span>
          <span className="block text-taupe">{hasPin ? f.pin.text : f.pin.textNoPin}</span>
        </span>
      </div>
    </div>
  );
}

/**
 * The lead-in to the nearest pin: a ring that pulses around it and dashes that flow from the last banner towards it.
 * The shapes are moved by hand, straight on the DOM, instead of through React state. A state update is a render behind
 * the map; this follows the marker in the same frame, so the ring stays glued to it while the rider drags or tilts the map.
 */
function PinGuide({ pin, boxRef }: { pin: HTMLElement; boxRef: RefObject<HTMLDivElement | null> }) {
  const wrap = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const ping = useRef<SVGCircleElement>(null);
  const tag = useRef<HTMLSpanElement>(null);
  const label = coach.feed.pin.tag;

  useLayoutEffect(() => {
    const place = () => {
      const w = wrap.current;
      const r = pin.getBoundingClientRect();
      const box = boxRef.current?.getBoundingClientRect();
      if (!w || !box || !pin.isConnected) return;
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // off screen (or not laid out yet): hide the guide until the pin comes back
      const visible = r.width > 0 && x > 0 && x < vw && y > 0 && y < vh;
      w.style.opacity = visible ? "1" : "0";
      if (!visible) return;
      const from = { x: box.left + box.width / 2, y: box.bottom };
      const dx = x - from.x;
      const dy = y - from.y;
      const len = Math.hypot(dx, dy) || 1;
      const end = { x: x - (dx / len) * 38, y: y - (dy / len) * 38 }; // stop short of the pin so the dashes never cover it
      const ctrl = { x: from.x - Math.min(80, len * 0.25), y: from.y + len * 0.45 };
      path.current?.setAttribute("d", `M${from.x} ${from.y} Q${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`);
      for (const c of [ring.current, ping.current]) {
        c?.setAttribute("cx", String(x));
        c?.setAttribute("cy", String(y));
      }
      const t = tag.current;
      if (t) {
        t.style.left = `${x}px`;
        t.style.top = `${y < vh - 140 ? y + 36 : y - 62}px`;
      }
    };
    place();
    // MapLibre moves a marker by rewriting the style of its wrapper element; watching that runs this in the same frame.
    const marker = pin.closest<HTMLElement>(".maplibregl-marker") ?? pin;
    const watcher = new MutationObserver(place);
    watcher.observe(marker, { attributes: true, attributeFilter: ["style", "class"] });
    // The banner slides in and the page can resize; a frame loop covers anything the observer cannot see.
    let raf = requestAnimationFrame(function loop() {
      place();
      raf = requestAnimationFrame(loop);
    });
    window.addEventListener("resize", place);
    return () => {
      watcher.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
    };
  }, [pin, boxRef]);

  return (
    <div ref={wrap} aria-hidden className="pointer-events-none fixed inset-0 z-40 opacity-0">
      <style>{`
        @keyframes coach-flow { to { stroke-dashoffset: -28; } }
        @keyframes coach-ping { 0% { transform: scale(.7); opacity: .7; } 70%, 100% { transform: scale(1.7); opacity: 0; } }
        .coach-flow { animation: coach-flow 1.1s linear infinite; }
        .coach-ping { transform-box: fill-box; transform-origin: center; animation: coach-ping 1.8s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) { .coach-flow, .coach-ping { animation: none; } }
      `}</style>
      <svg width="100%" height="100%" className="absolute inset-0">
        <path ref={path} fill="none" stroke="var(--cat-verify)" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 13" className="coach-flow" />
        <circle ref={ring} r="30" fill="none" stroke="var(--cat-verify)" strokeWidth="2.5" strokeOpacity=".8" />
        <circle ref={ping} r="30" fill="none" stroke="var(--cat-verify)" strokeWidth="2" className="coach-ping" />
      </svg>
      <span
        ref={tag}
        className="absolute rounded-full bg-ivory/90 px-2.5 py-1 font-heading text-xs font-semibold whitespace-nowrap text-graphite shadow-float backdrop-blur-md"
        style={{ transform: "translateX(-50%)" }}
      >
        {label}
      </span>
    </div>
  );
}
