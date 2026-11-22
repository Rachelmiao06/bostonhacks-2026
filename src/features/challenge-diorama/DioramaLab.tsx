"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { Choice, Primary, Secondary } from "@/features/missions/Parts";
import { Sprite } from "@/features/missions/Collectibles";
import { text } from "@/features/missions/content";
import { cn } from "@/lib/utils";
import { Diorama, LANDMARKS, type Landmark, type Status, type When } from "./Diorama";
import { play } from "./sound";

type Step = "overview" | "when" | "status" | "note" | "done";
const ORDER: Step[] = ["overview", "when", "status", "note", "done"];
const FORM: Step[] = ["when", "status", "note"];
const EASE = [0.22, 1, 0.36, 1] as const;
type Phase = "idle" | "saving" | "failed" | "saved";

const panel: Variants = {
  enter: ({ dir, reduced }: { dir: number; reduced: boolean }) => ({ opacity: 0, x: reduced ? 0 : dir * 32 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.38, ease: EASE } },
  exit: ({ dir, reduced }: { dir: number; reduced: boolean }) => ({ opacity: 0, x: reduced ? 0 : dir * -32, transition: { duration: reduced ? 0.1 : 0.2, ease: EASE } }),
};

const DAY = "linear-gradient(180deg, color-mix(in oklab, var(--sky) 42%, var(--ivory)) 0%, color-mix(in oklab, var(--sky) 14%, var(--ivory)) 55%, var(--ivory) 100%)";
const DUSK = "linear-gradient(180deg, color-mix(in oklab, var(--cherry) 22%, var(--sun) 38%) 0%, color-mix(in oklab, var(--sun) 30%, var(--ivory)) 60%, var(--ivory) 100%)";

/**
 * ISOLATED TEST: the whole screen is the miniature station. There is no box around it; the question is a glass card
 * floating over the world, and the camera moves to each object as you go. Nothing is saved or sent: the "server" is
 * a 1.4 second timer, so you can see that the seal and the finish only happen after it says saved.
 */
export function DioramaLab() {
  const os = useReducedMotion() ?? false;
  const [forced, setForced] = useState(false);
  const [slow, setSlow] = useState(false);
  const [failNext, setFailNext] = useState(false);
  const [sound, setSound] = useState(false);
  const [landmark, setLandmark] = useState<Landmark>("elevator");
  const noun = LANDMARKS[landmark].label;
  const tick = () => { if (sound) play("tick"); };
  const reduced = os || forced;

  const [step, setStep] = useState<Step>("overview");
  const [dir, setDir] = useState<1 | -1>(1);
  const [when, setWhen] = useState<When | "not_yet" | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { body.current?.querySelector<HTMLElement>("[data-heading]")?.focus({ preventScroll: true }); }, [step]);

  const go = (to: Step) => { setDir(ORDER.indexOf(to) >= ORDER.indexOf(step) ? 1 : -1); setStep(to); };
  const back = () => go(ORDER[Math.max(0, ORDER.indexOf(step) - 1)]);
  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    setWhen(null); setStatus(null); setNote(""); setPhase("idle"); go("overview");
  };
  const share = () => {
    setPhase("saving");
    timer.current = setTimeout(() => {
      if (failNext) { setPhase("failed"); setFailNext(false); return; }
      setPhase("saved"); go("done");
    }, 1400);
  };

  const sceneWhen: When | null = when === "now" || when === "earlier" ? when : null;
  const dusk = sceneWhen === "earlier";
  const view = phase === "saved" || step === "done" ? "final" : step === "note" ? "note" : step === "status" ? "status" : step === "when" ? "when" : "overview";
  const idx = FORM.indexOf(step);
  const canNext = step === "when" ? sceneWhen !== null : step === "status" ? status !== null : true;

  return (
    <MotionConfig reducedMotion={forced ? "always" : "user"}>
      <main className="fixed inset-0 z-0 flex flex-col overflow-hidden font-ui" style={{ background: DAY }}>
        <div aria-hidden className="absolute inset-0" style={{ background: DUSK, opacity: dusk ? 1 : 0, transition: reduced ? "none" : "opacity 0.9s" }} />

        {/* Floating top bar: back, where you are, and the test switches. No box. */}
        <div className="relative z-20 mx-auto flex w-full max-w-[34rem] items-center justify-between gap-2 px-3 pt-[4.75rem] [@media(max-height:740px)]:pt-[4.25rem]">
          {step !== "overview" ? (
            <button type="button" aria-label={text.back} onClick={back} className="grid size-11 cursor-pointer place-items-center rounded-full border border-ivory/80 bg-ivory/55 text-graphite shadow-float outline-none backdrop-blur-xl focus-visible:ring-4 focus-visible:ring-graphite/25">
              <ArrowLeft className="size-5" aria-hidden />
            </button>
          ) : <span className="size-11" />}
          <p className="rounded-full border border-ivory/80 bg-ivory/55 px-3.5 py-1.5 text-sm font-medium text-graphite shadow-float backdrop-blur-xl" aria-live="polite">
            {idx >= 0 ? text.stepOf(idx + 1, 3) : step === "done" ? "Complete" : "Community mission"}
          </p>
          <details className="relative">
            <summary aria-label="Test controls" className="grid size-11 cursor-pointer list-none place-items-center rounded-full border border-ivory/80 bg-ivory/55 text-graphite shadow-float outline-none backdrop-blur-xl focus-visible:ring-4 focus-visible:ring-graphite/25 [&::-webkit-details-marker]:hidden">
              <SlidersHorizontal className="size-5" aria-hidden />
            </summary>
            <section aria-label="Test controls" className="absolute top-full right-0 mt-2 w-72 space-y-2.5 rounded-2xl border border-ivory/80 bg-ivory/85 p-3 text-sm text-graphite shadow-ticket backdrop-blur-2xl">
              <p className="font-semibold">Rough test · nothing saved or sent</p>
              <Toggle label="Reduced Motion" on={reduced} locked={os} onChange={setForced} />
              <Toggle label="Slow-mo ×3" on={slow} onChange={setSlow} />
              <Toggle label="Sound" on={sound} onChange={setSound} />
              <Toggle label="Server fails on next share" on={failNext} onChange={setFailNext} />
              <label className="flex items-center gap-2 text-xs font-semibold">Category
                <select value={landmark} onChange={(e) => setLandmark(e.target.value as Landmark)} className="rounded-full border border-graphite/25 bg-ivory px-2 py-1 text-xs outline-none focus-visible:ring-4 focus-visible:ring-graphite/25">
                  {(Object.keys(LANDMARKS) as Landmark[]).map((k) => <option key={k} value={k}>{LANDMARKS[k].label}</option>)}
                </select>
              </label>
              <button type="button" onClick={reset} className="cursor-pointer rounded-full px-1 py-1 font-semibold underline underline-offset-4 outline-none focus-visible:ring-4 focus-visible:ring-graphite/25">Reset</button>
            </section>
          </details>
        </div>

        {/* The world fills the screen behind everything. The camera moves inside it. */}
        <div className="relative z-0 min-h-0 flex-1" style={{ containerType: "size" }}>
          <div className="absolute inset-0 grid place-items-center">
          <div style={{ width: "min(100cqw, 34rem, 170cqh)" }}>
            <Diorama bare view={view} landmark={landmark} when={sceneWhen} status={status} rider={step === "note" || step === "done"} note={note.trim().length > 0} saving={phase === "saving"} failed={phase === "failed"} confirmed={phase === "saved"} reduced={reduced} slow={slow ? 3 : 1} sound={sound} />
          </div>
          </div>
        </div>

        {/* The question: a glass card floating over the world. */}
        <div className="relative z-10 mx-auto w-full max-w-[34rem] shrink-0 px-3 pb-3">
          <div className="overflow-hidden rounded-[1.75rem] border border-ivory/80 bg-ivory/60 shadow-ticket backdrop-blur-2xl">
            <div ref={body} className="relative max-h-[52dvh] min-h-[10rem] overflow-y-auto overscroll-contain px-5 pt-5 pb-2 [@media(max-height:740px)]:pt-4 [@media(max-height:740px)]:[&_fieldset]:space-y-2 [@media(max-height:740px)]:[&_label]:min-h-12 [@media(max-height:740px)]:[&_label]:p-2.5 [@media(max-height:740px)]:[&_span.text-taupe]:hidden">
              <AnimatePresence mode="popLayout" custom={{ dir, reduced }} initial={false}>
                <motion.div key={step} custom={{ dir, reduced }} variants={panel} initial="enter" animate="center" exit="exit">
                  {step === "overview" && (
                    <Panel title={`Is the ${noun} at Park Street working?`}>
                      <p className="text-[0.95rem] leading-relaxed text-graphite/85">The MBTA lists this {noun} as out of service. Help other riders by checking the current status.</p>
                      <p className="text-sm text-taupe">Pick an answer on each step and watch the little station respond.</p>
                    </Panel>
                  )}
                  {step === "when" && (
                    <Panel title={text.whenTitle(`the ${noun}`)}>
                      <fieldset className="space-y-2.5">
                        <legend className="sr-only">{text.whenTitle(`the ${noun}`)}</legend>
                        <Choice name="when" value="now" checked={when === "now"} onChange={() => { tick(); setWhen("now"); }} label={text.whenNow.label} hint={text.whenNow.hint} icon="spark" />
                        <Choice name="when" value="earlier" checked={when === "earlier"} onChange={() => { tick(); setWhen("earlier"); }} label={text.whenEarlier.label} hint={text.whenEarlier.hint} icon="train" />
                        <Choice name="when" value="not_yet" checked={when === "not_yet"} onChange={() => { tick(); setWhen("not_yet"); }} label={text.whenNot.label} hint={text.whenNot.hint} icon="question" />
                      </fieldset>
                      {when === "not_yet" && <p role="status" className="rounded-2xl border border-graphite/12 bg-ivory/70 p-3.5 text-sm leading-relaxed text-taupe">{text.notYetBody}</p>}
                    </Panel>
                  )}
                  {step === "status" && (
                    <Panel title="What did you see?">
                      <fieldset className="space-y-2.5">
                        <legend className="sr-only">What did you see?</legend>
                        <Choice name="status" value="working" checked={status === "working"} onChange={() => { tick(); setStatus("working"); }} label="It’s working" hint="It moved, opened, or lit up normally" icon="check" />
                        <Choice name="status" value="out" checked={status === "out"} onChange={() => { tick(); setStatus("out"); }} label="It’s still out of service" hint="A sign, closed, or it didn’t respond" icon="barrier" />
                        <Choice name="status" value="unsure" checked={status === "unsure"} onChange={() => { tick(); setStatus("unsure"); }} label="I couldn’t tell" hint="That’s fine, tell us what you could see" icon="question" />
                      </fieldset>
                    </Panel>
                  )}
                  {step === "note" && (
                    <Panel title={text.noteTitle} sub={text.noteOptional}>
                      <textarea aria-label={text.noteLabel} value={note} maxLength={280} rows={3} onChange={(e) => setNote(e.target.value)} placeholder="Anything that would help the next rider" className="w-full resize-none rounded-2xl border border-graphite/20 bg-ivory/80 p-3.5 text-base leading-relaxed text-graphite outline-none placeholder:text-taupe/80 focus-visible:border-graphite/50 focus-visible:ring-4 focus-visible:ring-graphite/10" />
                      <p className="text-right text-xs text-taupe tabular-nums">{note.length} / 280</p>
                      {phase === "failed" && <p role="alert" className="rounded-2xl border border-graphite/15 bg-ivory/80 p-3.5 text-base leading-snug text-graphite">{text.errors.save}</p>}
                    </Panel>
                  )}
                  {step === "done" && (
                    <Panel title={text.doneTitle}>
                      <p className="text-[0.95rem] text-graphite/85">{text.doneBody}</p>
                      <motion.div initial={reduced ? false : { opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: reduced ? 0 : 3.2, type: "spring", stiffness: 260, damping: 20 }} className="flex items-center gap-3 rounded-2xl border border-graphite/12 bg-ivory/70 p-3.5" role="status">
                        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-sun/15"><Sprite index={0} className="size-11 motion-safe:animate-float" /></span>
                        <div><p className="text-xs font-medium tracking-wide text-taupe uppercase">New for your little world</p><p className="font-semibold text-graphite">Grass and flowers</p></div>
                      </motion.div>
                    </Panel>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <footer className="space-y-2 px-5 pt-1 pb-5 [@media(max-height:740px)]:pb-4">
              {step === "overview" && <Primary onClick={() => go("when")}>{text.start} <span aria-hidden>→</span></Primary>}
              {(step === "when" || step === "status") && <Primary disabled={!canNext} onClick={() => go(step === "when" ? "status" : "note")}>Next <span aria-hidden>→</span></Primary>}
              {step === "note" && <Primary disabled={phase === "saving"} onClick={share}>{phase === "saving" ? text.sharing : phase === "failed" ? text.retry : text.share}</Primary>}
              {step === "done" && (<><Primary onClick={reset}>{text.exploreWorld} <span aria-hidden>→</span></Primary><Secondary onClick={() => go("note")}>{text.edit}</Secondary></>)}
            </footer>
          </div>
        </div>
      </main>
    </MotionConfig>
  );
}

function Panel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 data-heading tabIndex={-1} className="font-serif text-[1.55rem] leading-tight font-semibold tracking-tight text-graphite outline-none [@media(max-height:740px)]:text-[1.3rem]">{title}</h2>
        {sub && <p className="text-sm font-medium text-taupe">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, on, onChange, locked }: { label: string; on: boolean; onChange: (v: boolean) => void; locked?: boolean }) {
  return (
    <label className={cn("flex items-center gap-2 text-xs font-semibold", locked ? "opacity-70" : "cursor-pointer")}>
      <input type="checkbox" role="switch" checked={on} disabled={locked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span aria-hidden className="relative h-5 w-9 rounded-full border border-graphite/25 bg-graphite/10 transition-colors peer-checked:bg-cat-verify peer-focus-visible:ring-4 peer-focus-visible:ring-graphite/25">
        <span className={cn("absolute top-0.5 left-0.5 size-3.5 rounded-full bg-ivory shadow-float transition-transform", on && "translate-x-4")} />
      </span>
      {label}
    </label>
  );
}
