"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, MapPin, Sparkles, type LucideIcon } from "lucide-react";
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
 *  3. one small card at the top left: "every pin is a challenge" and the four kinds of problems.
 * It never blocks the map. Escape or "Got it" ends it for good.
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
  if (phase === "live") return <GuideCard onDone={endLive} />;
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
        className="w-full max-w-md rounded-3xl bg-ivory/78 px-6 pt-4 pb-5 font-ui text-graphite shadow-float backdrop-blur-xl backdrop-saturate-150 motion-safe:animate-in motion-safe:zoom-in-95"
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

/* ---------- 3. The guide card ---------- */

function GuideCard({ onDone }: { onDone: () => void }) {
  const g = coach.guide;
  const done = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    done.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      role="dialog"
      aria-label={g.label}
      className="fixed top-[9.5rem] left-2 z-50 w-[min(19rem,calc(100vw-1rem))] rounded-3xl bg-ivory/80 p-4 font-ui text-graphite shadow-float backdrop-blur-xl backdrop-saturate-150 sm:top-[8.75rem] sm:left-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-500"
    >
      <p className="font-heading text-lg leading-tight font-semibold">{g.title}</p>
      <p className="mt-1 text-xs leading-snug text-taupe">{g.text}</p>
      <p className="mt-4 font-mono text-[0.62rem] tracking-[0.14em] text-taupe uppercase">{g.kindsTitle}</p>
      <ul className="mt-2 space-y-2.5">
        {categories.map((c) => {
          const st = categoryStyle[c.id];
          const KindIcon = st.icon;
          return (
            <li key={c.id} className="flex items-start gap-2.5 text-xs leading-snug">
              <KindIcon className={cn("mt-0.5 size-4 shrink-0", st.text)} aria-hidden />
              <span>
                <span className="font-semibold">{c.label}.</span> <span className="text-taupe">{coach.kinds[c.id]}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <button ref={done} type="button" onClick={onDone} className={`${primaryClass} mt-4 h-9 w-full px-4 text-xs`} style={primaryStyle}>
        {g.done}
      </button>
    </section>
  );
}
