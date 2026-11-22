"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { categoryStyle } from "@/features/explore/category";
import { glassClass, glassStyle, primaryClass, primaryStyle } from "@/features/explore/glass";
import { hasSeen } from "@/features/explore/onboarding";
import { coach } from "./content";
import { coachMarkSeen, coachReset, coachSeen } from "./storage";

type Phase = "idle" | "intro" | "waiting" | "tour";

/** Fired by anything (a button, Trolley) to replay the tour: `window.dispatchEvent(new Event("tada:coach:start"))`. */
export const COACH_START_EVENT = "tada:coach:start";

/**
 * The first-visit coach. Step 0 explains what Tada is, over the map. Once the rider has chosen where to start
 * (location, a station, or "just explore") and the welcome card is gone, a short walkthrough explains the map,
 * the four kinds of problems, the marks, how a challenge opens, and My World. It never blocks the map: the card
 * sits at the lower left (a sheet on phones), and Escape or "Skip" ends it for good.
 */
export function CoachTour() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0);

  const begin = useCallback(() => {
    setStep(0);
    setPhase("intro");
  }, []);

  // Decide what to show, once, in the browser.
  useEffect(() => {
    const replay = new URLSearchParams(window.location.search).get("tour") === "1";
    if (replay) coachReset();
    const t = window.setTimeout(() => {
      if (!coachSeen("intro")) setPhase("intro");
      else if (!coachSeen("tour")) setPhase("waiting");
    }, 600);
    const onStart = () => {
      coachReset();
      begin();
    };
    window.addEventListener(COACH_START_EVENT, onStart);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener(COACH_START_EVENT, onStart);
    };
  }, [begin]);

  // After the intro: wait until the rider has chosen where to start and the welcome card has gone, then settle a moment.
  useEffect(() => {
    if (phase !== "waiting") return;
    let quiet = 0;
    const id = window.setInterval(() => {
      const welcomeShowing = document.body.innerText.includes("Where should we start?");
      quiet = hasSeen("welcomed") && !welcomeShowing ? quiet + 1 : 0;
      if (quiet >= 4) {
        window.clearInterval(id);
        setStep(0);
        setPhase("tour");
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [phase]);

  const finishIntro = () => {
    coachMarkSeen("intro");
    setPhase("waiting");
  };
  const finishTour = useCallback(() => {
    coachMarkSeen("intro");
    coachMarkSeen("tour");
    setPhase("idle");
  }, []);

  useEffect(() => {
    if (phase !== "intro" && phase !== "tour") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (phase === "intro") {
        coachMarkSeen("intro");
        setPhase("waiting");
      } else finishTour();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, finishTour]);

  if (phase === "intro") return <Intro onStart={finishIntro} />;
  if (phase === "tour") return <Walkthrough step={step} setStep={setStep} onDone={finishTour} />;
  return null;
}

/* ---------- Step 0: what is Tada ---------- */

function Intro({ onStart }: { onStart: () => void }) {
  const primary = useRef<HTMLButtonElement>(null);
  useEffect(() => primary.current?.focus(), []);
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
        <h2 id="coach-intro-title" className="mt-1 font-heading text-2xl leading-tight font-semibold">{t.title}</h2>
        <p className="mt-2 text-sm leading-relaxed">{t.body}</p>
        <p className="mt-2 text-xs leading-snug text-taupe">{t.honest}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
          <button ref={primary} type="button" onClick={onStart} className={`${primaryClass} h-11 px-6 text-sm`} style={primaryStyle}>
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
  return (
    <svg viewBox="0 0 320 120" role="img" aria-label="A small map with train lines and problem pins" className="h-28 w-full rounded-2xl bg-stone">
      <path d="M0 90 C70 90 90 40 160 50 S270 30 320 20" className="fill-none stroke-cat-verify" strokeWidth="5" strokeLinecap="round" />
      <path d="M40 120 C80 80 130 80 180 70 S250 90 300 110" className="fill-none stroke-cat-station" strokeWidth="5" strokeLinecap="round" />
      {[[70, 80], [160, 50], [235, 36], [180, 70]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" className="fill-ivory stroke-graphite" strokeWidth="2" />
      ))}
      {[[160, 50, "service"], [235, 36, "access"], [70, 80, "station"]].map(([x, y, k]) => (
        <g key={`${x}-${k}`} transform={`translate(${x} ${Number(y) - 16})`}>
          <circle r="10" className={cn("stroke-ivory", pinFill[k as keyof typeof pinFill])} strokeWidth="2.5" />
          <circle r="3" className="fill-ivory" />
        </g>
      ))}
    </svg>
  );
}
const pinFill = { service: "fill-cat-service", access: "fill-cat-access", station: "fill-cat-station" };

/* ---------- Steps 1..n: the walkthrough ---------- */

function Walkthrough({ step, setStep, onDone }: { step: number; setStep: (n: number) => void; onDone: () => void }) {
  const steps = coach.steps;
  const s = steps[step];
  const last = step === steps.length - 1;
  const primary = useRef<HTMLButtonElement>(null);
  useEffect(() => primary.current?.focus({ preventScroll: true }), [step]);

  return (
    <div
      role="dialog"
      aria-label={coach.label}
      aria-live="polite"
      className="fixed inset-x-2 bottom-20 z-50 rounded-3xl border border-ivory/80 bg-gradient-to-br from-ivory/95 to-ivory/85 p-4 font-ui text-graphite shadow-float backdrop-blur-xl sm:inset-x-auto sm:bottom-16 sm:left-4 sm:w-[23rem]"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[0.62rem] tracking-[0.14em] text-taupe uppercase">{coach.step(step + 1, steps.length)}</p>
        <button type="button" onClick={onDone} className="cursor-pointer text-xs text-taupe underline underline-offset-4 outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/30">
          {coach.skip}
        </button>
      </div>
      <h2 key={s.id} className="mt-1.5 font-heading text-xl leading-tight font-semibold motion-safe:animate-in motion-safe:fade-in">{s.title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-graphite/90">{s.body}</p>
      <div className="mt-3"><Visual id={s.visual} /></div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-1.5" aria-hidden>
          {steps.map((x, i) => (
            <span key={x.id} className={cn("h-1.5 rounded-full transition-all", i === step ? "w-5 bg-cat-verify" : "w-1.5 bg-graphite/20")} />
          ))}
        </div>
        <div className="flex gap-2">
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className={`${glassClass} h-9 px-4 text-xs`} style={glassStyle}>
              {coach.back}
            </button>
          )}
          <button ref={primary} type="button" onClick={() => (last ? onDone() : setStep(step + 1))} className={`${primaryClass} h-9 px-4 text-xs`} style={primaryStyle}>
            {last ? coach.done : coach.next}
          </button>
        </div>
      </div>
    </div>
  );
}

function Visual({ id }: { id: (typeof coach.steps)[number]["visual"] }) {
  if (id === "kinds") {
    return (
      <ul className="space-y-1.5">
        {coach.kinds.map((k) => {
          const st = categoryStyle[k.id];
          const Icon = st.icon;
          return (
            <li key={k.id} className="flex items-start gap-2.5 rounded-xl border border-hairline bg-ivory/70 p-2">
              <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full", st.soft)}>
                <Icon className={cn("size-3.5", st.text)} aria-hidden />
              </span>
              <span className="text-xs leading-snug">
                <span className="font-semibold">{k.label}.</span> <span className="text-taupe">{k.text}</span>
              </span>
            </li>
          );
        })}
      </ul>
    );
  }
  if (id === "marks") {
    return (
      <ul className="space-y-1.5">
        {coach.marks.map((m) => (
          <li key={m.kind} className="flex items-start gap-2.5 rounded-xl border border-hairline bg-ivory/70 p-2">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center"><MarkIcon kind={m.kind} /></span>
            <span className="text-xs leading-snug">
              <span className="font-semibold">{m.label}.</span> <span className="text-taupe">{m.text}</span>
            </span>
          </li>
        ))}
      </ul>
    );
  }
  if (id === "ticket") {
    const t = coach.ticket;
    return (
      <div className="rounded-2xl border border-hairline bg-ivory p-3 shadow-float">
        <p className="font-mono text-[0.6rem] tracking-[0.12em] text-taupe uppercase">{t.station}</p>
        <p className="mt-0.5 font-heading text-base font-semibold">{t.alert}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className={`${primaryClass} h-8 px-3 text-[0.7rem]`} style={primaryStyle}>{t.report}</span>
          <span className={`${glassClass} h-8 px-3 text-[0.7rem]`} style={glassStyle}>{t.verify}</span>
        </div>
      </div>
    );
  }
  return null; // "map" and "world" are explained in words; the real map is right behind the card
}

function MarkIcon({ kind }: { kind: string }) {
  if (kind === "number") {
    return <span className="flex size-6 items-center justify-center rounded-full border-2 border-graphite bg-ivory font-mono text-[0.7rem] font-semibold">3</span>;
  }
  if (kind === "landmark") {
    return (
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
        <path d="M3 21V10l9-6 9 6v11z" className="fill-cat-service" />
        <path d="M9 21v-6h6v6" className="fill-ivory" />
      </svg>
    );
  }
  return <span className="size-4 rounded-full border-2 border-graphite bg-ivory" />;
}
