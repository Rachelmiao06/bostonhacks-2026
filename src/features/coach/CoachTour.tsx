"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, MapPin, Sparkles, TrainFront, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { categories } from "@/features/explore/content";
import { categoryStyle } from "@/features/explore/category";
import { glassClass, glassStyle, primaryClass, primaryStyle } from "@/features/explore/glass";
import { hasSeen } from "@/features/explore/onboarding";
import { coach } from "./content";
import { coachMarkSeen, coachReset, coachSeen } from "./storage";

type Phase = "idle" | "intro" | "waiting" | "live";

/** Fired by anything (a button, Trolley) to replay the coach: `window.dispatchEvent(new Event("tada:coach:start"))`. */
export const COACH_START_EVENT = "tada:coach:start";

/** Text on screen while the map is still zooming to the rider's start; the live guide waits until none of it is showing. */
const BUSY_TEXT = ["Where should we start?", "Finding problems near you", "Almost there", "Finding the nearest stop"];

/**
 * The first-visit coach, spread over the first minute instead of one big tour:
 *  1. a punchy card that says what Tada is and its three features, before anything else;
 *  2. the normal welcome, where the rider picks a start and the map zooms to it;
 *  3. a live-stream style feed at the top right: short chat messages that arrive one by one and explain the
 *     problem kinds, the marks, and "every pin is a challenge".
 * It never blocks the map. Escape or "Skip" ends it for good.
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
  if (phase === "live") return <LiveGuide onDone={endLive} />;
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
        <MiniMap />
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
          <button ref={primary} type="button" onClick={onStart} className={`${primaryClass} h-11 flex-1 px-6 text-sm`} style={primaryStyle}>
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

/** A tiny drawn map: two lines, a few stops and three pins, so "a map of problems" is clear before any real map is read. */
function MiniMap() {
  const pinFill = { service: "fill-cat-service", access: "fill-cat-access", station: "fill-cat-station" } as const;
  return (
    <svg viewBox="0 0 320 120" role="img" aria-label="A small map with train lines and problem pins" className="h-24 w-full rounded-2xl bg-stone">
      <path d="M0 90 C70 90 90 40 160 50 S270 30 320 20" className="fill-none stroke-cat-verify" strokeWidth="5" strokeLinecap="round" />
      <path d="M40 120 C80 80 130 80 180 70 S250 90 300 110" className="fill-none stroke-cat-station" strokeWidth="5" strokeLinecap="round" />
      {[[70, 80], [160, 50], [235, 36], [180, 70]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" className="fill-ivory stroke-graphite" strokeWidth="2" />
      ))}
      {([[160, 50, "service"], [235, 36, "access"], [70, 80, "station"]] as const).map(([x, y, k]) => (
        <g key={`${x}-${k}`} transform={`translate(${x} ${y - 16})`}>
          <circle r="10" className={cn("stroke-ivory", pinFill[k])} strokeWidth="2.5" />
          <circle r="3" className="fill-ivory" />
        </g>
      ))}
    </svg>
  );
}

/* ---------- 3. The live guide ---------- */

/** How long to read a message before the next one arrives. */
const readMs = (text: string) => 1800 + text.length * 30;
const SHOWN = 4; // messages kept on screen; older ones scroll away
const LINGER_MS = 14000; // after the last message, before the guide puts itself away

function LiveGuide({ onDone }: { onDone: () => void }) {
  const messages = coach.messages;
  const [count, setCount] = useState(0);

  useEffect(() => {
    const last = count >= messages.length;
    const wait = last ? LINGER_MS : count === 0 ? 700 : readMs(messages[count - 1].text);
    const id = window.setTimeout(() => (last ? onDone() : setCount(count + 1)), wait);
    return () => window.clearTimeout(id);
  }, [count, messages, onDone]);

  const visible = messages.slice(Math.max(0, count - SHOWN), count);
  const first = Math.max(0, count - SHOWN);

  return (
    <section
      aria-label={coach.live.label}
      className="pointer-events-none fixed top-[9.5rem] right-2 z-50 w-[min(19rem,calc(100vw-1rem))] font-ui text-graphite sm:top-[7.75rem] sm:right-4 sm:w-80"
    >
      <div className="pointer-events-auto flex items-center justify-between gap-2 rounded-2xl border border-ivory/80 bg-ivory/90 py-1.5 pr-1.5 pl-3 shadow-float backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span aria-hidden className="relative flex size-2.5">
            <span className="absolute inline-flex size-full rounded-full bg-cherry opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2.5 rounded-full bg-cherry" />
          </span>
          <p className="text-xs leading-tight">
            <span className="font-heading text-sm font-semibold">{coach.live.title}</span>{" "}
            <span className="text-taupe">{coach.live.sub}</span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onDone} className="cursor-pointer rounded-full px-2 py-1 text-xs text-taupe underline underline-offset-4 outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/30">
            {coach.live.skip}
          </button>
          <button type="button" onClick={onDone} aria-label={coach.live.close} className="flex size-7 cursor-pointer items-center justify-center rounded-full text-taupe outline-none hover:bg-stone-deep/60 hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/30">
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div role="log" aria-live="polite" className="mt-2 flex flex-col gap-1.5">
        {visible.map((m, i) => {
          const fromEnd = visible.length - 1 - i;
          return <Message key={first + i} text={m.text} kind={"kind" in m ? m.kind : undefined} fade={[1, 0.88, 0.62, 0.38][fromEnd] ?? 0.3} />;
        })}
      </div>
    </section>
  );
}

function Message({ text, kind, fade }: { text: string; kind?: (typeof categories)[number]["id"]; fade: number }) {
  const tag = kind ? categories.find((c) => c.id === kind) : undefined;
  const style = kind ? categoryStyle[kind] : undefined;
  const Icon = style?.icon;
  return (
    <div
      style={{ opacity: fade }}
      className="flex gap-2 rounded-2xl border border-ivory/80 bg-ivory/90 p-2.5 shadow-float backdrop-blur-xl transition-opacity duration-500 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500"
    >
      <span aria-hidden className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-cat-verify">
        <TrainFront className="size-3.5 text-ivory" />
      </span>
      <div className="min-w-0 text-xs leading-snug">
        <p className="flex flex-wrap items-center gap-1.5">
          <span className="font-heading text-[0.8rem] font-semibold">{coach.live.author}</span>
          {tag && style && Icon && (
            <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.62rem] font-medium", style.soft, style.text)}>
              <Icon className="size-3" aria-hidden />
              {tag.label}
            </span>
          )}
        </p>
        <p className="mt-0.5 text-graphite/90">{text}</p>
      </div>
    </div>
  );
}
