"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Activity } from "./Activity";
import { checkPhoto, findNearby, ReportApiError } from "./api";
import { Camera, type Shot } from "./Camera";
import { content } from "./content";
import { KnittedCamera, KnittedControl, KnittedHills, KnittedSuccess, YarnBall } from "./Knitted";
import { Prepare } from "./Prepare";
import { Result, type Analysis } from "./Result";
import { loadCases, saveCase } from "./store";
import { Disclosure, field, PrimaryButton, SecondaryButton } from "./ui";
import { Verdict } from "./Verdicts";
import type { NearbyCase, SavedCase } from "./types";

type Step =
  | { name: "entry" }
  | { name: "activity"; highlight?: string }
  | { name: "camera" }
  | { name: "photo"; shot: Shot }
  | { name: "analyzing"; shot: Shot; note: string }
  | { name: "error"; shot: Shot; note: string; message: string; code?: string }
  | { name: "verdict"; shot: Shot; analysis: Analysis }
  | { name: "result"; shot: Shot; analysis: Analysis; service?: string }
  | { name: "prepare"; shot: Shot; analysis: Analysis; service: string }
  | { name: "done"; caseId: string; followed: boolean };

/** The Report journey: Entry, Camera, Photo, Analyzing, Result (or a safety state), Guided action, Activity. */
export function Report() {
  const [step, setStep] = useState<Step>({ name: "entry" });
  const top = useRef<HTMLDivElement>(null);

  // Each new screen starts at the top.
  useEffect(() => {
    top.current?.scrollIntoView({ block: "start" });
  }, [step.name]);

  const entry = () => setStep({ name: "entry" });
  const camera = () => setStep({ name: "camera" });

  function follow(n: NearbyCase, service: string, shot: Shot, description: string) {
    const c: SavedCase = { caseId: n.caseId, kind: "followed", serviceName: service, team: n.team ?? "Boston 311", description: description || n.serviceName, lat: shot.lat, lng: shot.lng, thumb: shot.thumb, createdAt: Date.now(), lastStage: "in_progress" };
    saveCase(c);
    setStep({ name: "done", caseId: c.caseId, followed: true });
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl grid-cols-[minmax(0,1fr)] gap-4 pb-20 font-ui text-graphite">
      <div ref={top} className="scroll-mt-24" />
      {step.name === "entry" && <Entry onStart={camera} onActivity={() => setStep({ name: "activity" })} />}
      {step.name === "activity" && (
        <div className="mx-auto grid w-full max-w-xl gap-4">
          <button type="button" onClick={entry} className="flex w-fit items-center gap-1 rounded-full pr-3 text-sm text-taupe outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/50">
            <KnittedControl name="back" className="size-9" /> {content.back}
          </button>
          <h1 className="font-serif text-4xl leading-tight font-semibold">{content.activity.title}</h1>
          <Activity highlight={step.highlight} onCamera={camera} />
        </div>
      )}
      {step.name === "camera" && <Camera onShot={(shot) => setStep({ name: "photo", shot })} onClose={entry} />}
      {step.name === "photo" && <PhotoConfirm shot={step.shot} onRetake={camera} onUse={(note) => setStep({ name: "analyzing", shot: step.shot, note })} />}
      {step.name === "analyzing" && (
        <Analyzing
          shot={step.shot}
          note={step.note}
          onDone={(analysis) => setStep(analysis.result.verdict === "fixable" ? { name: "result", shot: step.shot, analysis } : { name: "verdict", shot: step.shot, analysis })}
          onError={(e) => setStep({ name: "error", shot: step.shot, note: step.note, message: e.message, code: e instanceof ReportApiError ? e.code : undefined })}
        />
      )}
      {step.name === "error" && <ErrorCard step={step} onRetry={() => setStep({ name: "analyzing", shot: step.shot, note: step.note })} onRetake={camera} onHome={entry} />}
      {step.name === "verdict" && <Verdict shot={step.shot} result={step.analysis.result} onRetake={camera} onCancel={entry} />}
      {step.name === "result" && (
        <Result
          shot={step.shot}
          analysis={step.analysis}
          initialService={step.service}
          onPrepare={(service) => setStep({ name: "prepare", shot: step.shot, analysis: step.analysis, service })}
          onFollow={(n, service) => follow(n, service, step.shot, step.analysis.result.description)}
          onCancel={entry}
        />
      )}
      {step.name === "prepare" && (
        <Prepare
          shot={step.shot}
          result={step.analysis.result}
          service={step.service}
          onBack={() => setStep({ name: "result", shot: step.shot, analysis: step.analysis, service: step.service })}
          onSaved={(caseId) => setStep({ name: "done", caseId, followed: false })}
          onRetake={camera}
          onHome={entry}
        />
      )}
      {step.name === "done" && <Done followed={step.followed} onView={() => setStep({ name: "activity", highlight: step.caseId })} />}
    </div>
  );
}

function Entry({ onStart, onActivity }: { onStart: () => void; onActivity: () => void }) {
  // Saved cases live in the browser, so the count is read after load.
  const [count, setCount] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCount(loadCases().length);
  }, []);
  return (
    <section className="mx-auto grid w-full max-w-xl justify-items-center gap-5 py-2 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300 sm:gap-6 sm:py-12">
      <KnittedCamera className="w-40 sm:w-56" />
      <div className="grid gap-3">
        <h1 className="font-serif text-5xl leading-[1.05] font-semibold text-balance sm:text-6xl">{content.entry.headline}</h1>
        <p className="mx-auto max-w-md text-lg text-taupe text-balance">{content.entry.body}</p>
      </div>
      <PrimaryButton className="h-14 w-full max-w-sm text-lg" onClick={onStart}>
        {content.entry.cta}
      </PrimaryButton>
      {count > 0 && (
        <button type="button" onClick={onActivity} className="rounded-lg px-2 py-1 text-sm text-taupe underline underline-offset-4 outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/50">
          {content.entry.activity(count)}
        </button>
      )}
      <KnittedHills className="mt-2 w-full" />
    </section>
  );
}

function PhotoConfirm({ shot, onUse, onRetake }: { shot: Shot; onUse: (note: string) => void; onRetake: () => void }) {
  const [note, setNote] = useState("");
  return (
    <section className="mx-auto grid w-full max-w-xl gap-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shot.dataUrl} alt="Your photo" className="aspect-[4/3] max-h-[26rem] w-full rounded-3xl bg-stone-deep object-cover shadow-float" />
      <Disclosure summary={content.photo.noteSummary}>
        <label className="grid gap-1 text-sm">
          <span>{content.photo.noteLabel}</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={2} className={field} />
        </label>
      </Disclosure>
      <div className="grid gap-2">
        <PrimaryButton autoFocus className="h-14 text-base" onClick={() => onUse(note)}>
          {content.photo.use}
        </PrimaryButton>
        <SecondaryButton className="h-12" onClick={onRetake}>
          <RefreshCw className="size-4" aria-hidden /> {content.photo.retake}
        </SecondaryButton>
      </div>
    </section>
  );
}

/** The existing checks run here: location rules and Gemini first, then the real nearby-case lookup for a Boston 311 matter. No fake progress. */
function Analyzing({ shot, note, onDone, onError }: { shot: Shot; note: string; onDone: (a: Analysis) => void; onError: (e: Error) => void }) {
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const result = await checkPhoto({ image: shot.image, lat: shot.lat, lng: shot.lng, accuracy: shot.accuracy, note });
        let nearby: Analysis["nearby"] = "failed";
        if (result.verdict === "fixable") nearby = await findNearby(shot.lat, shot.lng, result.serviceName).catch(() => "failed" as const);
        else nearby = [];
        if (live) onDone({ result, nearby });
      } catch (e) {
        if (live) onError(e instanceof Error ? e : new Error("Something went wrong. Nothing was saved."));
      }
    })();
    return () => {
      live = false;
    };
    // run once per step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <section className="mx-auto grid w-full max-w-xl justify-items-center gap-6 py-8 text-center" aria-live="polite" aria-busy="true">
      <YarnBall className="w-56 sm:w-64" />
      <div>
        <h1 className="font-serif text-3xl font-semibold">{content.analyzing.title}</h1>
        <p className="mt-1 text-taupe">{content.analyzing.body}</p>
      </div>
      {/* Your own photo stays visible, small, so it is clear what is being looked at. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shot.thumb} alt="" className="size-14 rounded-2xl object-cover shadow-float" />
      <KnittedHills variant="river" className="mt-2 w-full" />
    </section>
  );
}

function ErrorCard({ step, onRetry, onRetake, onHome }: { step: Extract<Step, { name: "error" }>; onRetry: () => void; onRetake: () => void; onHome: () => void }) {
  // Location or photo problems need a new photo; connection problems only need another try.
  const retakeHelps = step.code === "location_inaccurate" || step.code === "no_location" || step.code === "bad_image";
  const final = step.code === "outside_boston";
  return (
    <section className="mx-auto grid w-full max-w-md gap-4 rounded-3xl border border-hairline bg-ivory p-5 shadow-float" role="alert">
      <p className="flex items-start gap-2 font-medium">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {step.message}
      </p>
      <p className="text-sm text-taupe">{content.nothingSent}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {final ? (
          <SecondaryButton onClick={onHome}>{content.back}</SecondaryButton>
        ) : (
          <>
            {retakeHelps ? <PrimaryButton onClick={onRetake}>{content.photo.retake}</PrimaryButton> : <PrimaryButton onClick={onRetry}>{content.retry}</PrimaryButton>}
            <SecondaryButton onClick={onHome}>{content.back}</SecondaryButton>
          </>
        )}
      </div>
    </section>
  );
}

function Done({ followed, onView }: { followed: boolean; onView: () => void }) {
  return (
    <section className="mx-auto grid w-full max-w-md gap-4 rounded-3xl border border-hairline bg-ivory p-5 shadow-float motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200" aria-live="polite">
      <div>
        <KnittedSuccess className="mb-3 w-24" />
        <h1 className="font-serif text-3xl leading-tight font-semibold">{followed ? content.done.followedTitle : content.done.savedTitle}</h1>
        <p className="mt-1 text-sm text-taupe">{followed ? content.done.followedBody : content.done.savedBody}</p>
      </div>
      <PrimaryButton autoFocus onClick={onView}>
        {content.done.view}
      </PrimaryButton>
    </section>
  );
}
