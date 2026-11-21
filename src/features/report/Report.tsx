"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera as CameraIcon, CircleHelp, Home, MapPinned, Phone, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";
import { checkPhoto, ReportApiError } from "./api";
import { Camera, type Shot } from "./Camera";
import { content, OFFICIAL_311 } from "./content";
import { MyReports } from "./MyReports";
import { Review } from "./Review";
import { Chip, Disclosure, field, Panel, PrimaryButton, SecondaryButton } from "./ui";
import type { CheckResult } from "./types";

type Step =
  | { name: "home" }
  | { name: "camera" }
  | { name: "photo"; shot: Shot }
  | { name: "checking"; shot: Shot; note: string }
  | { name: "error"; shot: Shot; note: string; message: string; code?: string }
  | { name: "verdict"; shot: Shot; result: CheckResult }
  | { name: "review"; shot: Shot; result: CheckResult }
  | { name: "done"; caseId: string; followed: boolean };

const STEP_ICONS = [CameraIcon, Sparkles, MapPinned];

export function Report() {
  const [step, setStep] = useState<Step>({ name: "home" });
  const [recent, setRecent] = useState<string>();
  const top = useRef<HTMLDivElement>(null);

  // Each new screen starts at the top.
  useEffect(() => {
    top.current?.scrollIntoView({ block: "start" });
  }, [step.name]);

  const home = () => setStep({ name: "home" });
  const camera = () => setStep({ name: "camera" });

  return (
    <div className="mx-auto grid w-full max-w-4xl grid-cols-[minmax(0,1fr)] gap-4 pb-20 font-ui text-graphite">
      <div ref={top} className="scroll-mt-24" />
      {step.name === "home" && <HomeScreen onStart={camera} highlight={recent} />}
      {step.name === "camera" && <Camera onShot={(shot) => setStep({ name: "photo", shot })} onClose={home} />}
      {step.name === "photo" && <PhotoConfirm shot={step.shot} onRetake={camera} onUse={(note) => setStep({ name: "checking", shot: step.shot, note })} />}
      {step.name === "checking" && (
        <Checking
          shot={step.shot}
          note={step.note}
          onResult={(result) => setStep(result.verdict === "fixable" ? { name: "review", shot: step.shot, result } : { name: "verdict", shot: step.shot, result })}
          onError={(e) => setStep({ name: "error", shot: step.shot, note: step.note, message: e.message, code: e instanceof ReportApiError ? e.code : undefined })}
        />
      )}
      {step.name === "error" && <ErrorCard step={step} onRetry={() => setStep({ name: "checking", shot: step.shot, note: step.note })} onRetake={camera} onHome={home} />}
      {step.name === "verdict" && <VerdictCard shot={step.shot} result={step.result} onRetake={camera} onHome={home} />}
      {step.name === "review" && <Review shot={step.shot} result={step.result} onDone={(caseId, followed) => {
          setRecent(caseId);
          setStep({ name: "done", caseId, followed });
        }} onRetake={camera} onCancel={home} />}
      {step.name === "done" && <Done followed={step.followed} onView={home} />}
    </div>
  );
}

function HomeScreen({ onStart, highlight }: { onStart: () => void; highlight?: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:items-start">
      <Panel className="grid gap-5">
        <div>
          <h1 className="font-serif text-3xl leading-tight font-semibold text-balance sm:text-4xl">{content.home.headline}</h1>
          <p className="mt-2 text-taupe">{content.home.body}</p>
        </div>
        <PrimaryButton className="h-14 text-base" onClick={onStart}>
          <CameraIcon className="size-5" aria-hidden /> {content.home.cta}
        </PrimaryButton>
        <ol className="grid grid-cols-3 gap-2 text-center text-xs" aria-label="How it works">
          {content.home.steps.map((s, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <li key={s.title} className="grid justify-items-center gap-1">
                <span className="grid size-10 place-items-center rounded-full bg-stone-deep/60" aria-hidden>
                  <Icon className="size-4" />
                </span>
                <strong className="text-sm">{s.title}</strong>
                <span className="text-taupe">{s.body}</span>
              </li>
            );
          })}
        </ol>
        <div className="grid gap-2">
          <Chip className="justify-self-start">{content.home.demo}</Chip>
          <Disclosure summary={content.privacy.summary}>
            <ul className="grid gap-1.5">
              {content.privacy.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Disclosure>
        </div>
      </Panel>
      <MyReports highlight={highlight} />
    </div>
  );
}

function PhotoConfirm({ shot, onUse, onRetake }: { shot: Shot; onUse: (note: string) => void; onRetake: () => void }) {
  const [note, setNote] = useState("");
  return (
    <Panel className="mx-auto grid w-full max-w-xl gap-4">
      <h2 className="font-serif text-xl font-semibold">{content.photo.title}</h2>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shot.dataUrl} alt="Your photo" className="aspect-[4/3] max-h-[22rem] w-full rounded-2xl bg-stone-deep object-cover" />
      <Disclosure summary={content.photo.noteSummary}>
        <label className="grid gap-1 text-sm">
          <span>{content.photo.noteLabel}</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={2} className={field} />
        </label>
      </Disclosure>
      <div className="grid gap-2 sm:grid-cols-2">
        <PrimaryButton autoFocus onClick={() => onUse(note)}>
          {content.photo.use}
        </PrimaryButton>
        <SecondaryButton onClick={onRetake}>
          <RefreshCw className="size-4" aria-hidden /> {content.photo.retake}
        </SecondaryButton>
      </div>
    </Panel>
  );
}

function Checking({ shot, note, onResult, onError }: { shot: Shot; note: string; onResult: (r: CheckResult) => void; onError: (e: Error) => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, content.checking.length - 1)), 2500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    let live = true;
    checkPhoto({ image: shot.image, lat: shot.lat, lng: shot.lng, accuracy: shot.accuracy, note })
      .then((r) => live && onResult(r))
      .catch((e) => live && onError(e instanceof Error ? e : new Error("Something went wrong. Nothing was saved.")));
    return () => {
      live = false;
    };
    // run once per step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Panel className="mx-auto flex w-full max-w-xl items-center gap-4" aria-live="polite" aria-busy="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shot.thumb} alt="" className="size-16 shrink-0 rounded-2xl object-cover motion-safe:animate-pulse" />
      <p className="text-sm text-taupe">{content.checking[i]}</p>
    </Panel>
  );
}

function ErrorCard({ step, onRetry, onRetake, onHome }: { step: Extract<Step, { name: "error" }>; onRetry: () => void; onRetake: () => void; onHome: () => void }) {
  // Location or photo problems need a new photo; connection problems only need another try.
  const retakeHelps = step.code === "location_inaccurate" || step.code === "no_location" || step.code === "bad_image";
  const final = step.code === "outside_boston";
  return (
    <Panel className="mx-auto grid w-full max-w-md gap-4" role="alert">
      <p className="flex items-start gap-2 font-medium">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {step.message}
      </p>
      <p className="text-sm text-taupe">{content.verdict.nothingSent}</p>
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
    </Panel>
  );
}

function VerdictCard({ shot, result, onRetake, onHome }: { shot: Shot; result: CheckResult; onRetake: () => void; onHome: () => void }) {
  if (result.verdict === "emergency") {
    return (
      <Panel className="mx-auto grid w-full max-w-md gap-4 border-cherry/50" role="alert">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
          <ShieldAlert className="size-5 text-cherry" aria-hidden /> {content.verdict.emergency.title}
        </h2>
        <p className="text-sm">{content.verdict.emergency.body}</p>
        <a
          href="tel:911"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-graphite px-5 font-medium text-ivory outline-none focus-visible:ring-2 focus-visible:ring-graphite/50 focus-visible:ring-offset-2"
        >
          <Phone className="size-4" aria-hidden /> {content.verdict.emergency.call}
        </a>
        <SecondaryButton onClick={onHome}>{content.back}</SecondaryButton>
      </Panel>
    );
  }
  const title = result.verdict === "private" ? content.verdict.private.title : content.verdict.unclear.title;
  return (
    <Panel className="mx-auto grid w-full max-w-md gap-4">
      <div className="flex gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={shot.thumb} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
        <div>
          <h2 className="font-serif text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm">{result.reason}</p>
          <p className="mt-1 text-xs text-taupe">{content.verdict.nothingSent}</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <PrimaryButton autoFocus onClick={onRetake}>
          {content.photo.retake}
        </PrimaryButton>
        <SecondaryButton onClick={onHome}>{content.back}</SecondaryButton>
      </div>
      <Disclosure summary={<span className="inline-flex items-center gap-1.5"><CircleHelp className="size-4" aria-hidden /> {content.verdict.wrongSummary}</span>}>
        <p>{content.verdict.wrongBody}</p>
        <a href={OFFICIAL_311} target="_blank" rel="noopener noreferrer" className="w-fit text-graphite underline underline-offset-4">
          {content.review.openOfficial}
        </a>
      </Disclosure>
    </Panel>
  );
}

function Done({ followed, onView }: { followed: boolean; onView: () => void }) {
  return (
    <Panel className="mx-auto grid w-full max-w-md gap-4" aria-live="polite">
      <div>
        <h2 className="font-serif text-xl font-semibold">{followed ? content.done.followedTitle : content.done.savedTitle}</h2>
        <p className="mt-1 text-sm text-taupe">{followed ? content.done.followedBody : content.done.savedBody}</p>
      </div>
      <PrimaryButton autoFocus onClick={onView}>
        <Home className="size-4" aria-hidden /> {content.done.view}
      </PrimaryButton>
    </Panel>
  );
}
