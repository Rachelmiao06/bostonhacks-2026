"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera as CameraIcon, MapPin, Phone, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkPhoto, findNearby, ReportApiError, sendReport } from "./api";
import { Camera, type Shot } from "./Camera";
import { CATEGORIES, teamFor } from "./categories";
import { content } from "./content";
import { MyReports } from "./MyReports";
import { introSeen, markIntroSeen, nowMs, saveCase } from "./store";
import type { CheckResult, NearbyCase, SavedCase } from "./types";

type Step =
  | { name: "home" }
  | { name: "camera" }
  | { name: "review"; shot: Shot }
  | { name: "checking"; shot: Shot; note: string }
  | { name: "error"; shot: Shot; note: string; message: string; code?: string }
  | { name: "verdict"; shot: Shot; result: CheckResult }
  | { name: "draft"; shot: Shot; result: CheckResult }
  | { name: "done"; caseId: string; followed: boolean };

const PERSONAL = /(\+?\d[\d\s().-]{8,}\d)|([\w.+-]+@[\w-]+\.[\w.-]+)/;
const card = "grid gap-4 rounded-3xl border border-hairline bg-ivory p-5 text-graphite shadow-float";

export function Report() {
  const [step, setStep] = useState<Step>({ name: "home" });
  const [intro, setIntro] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  // Reads browser storage once after load (it does not exist on the server).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIntro(!introSeen());
  }, []);
  // Each new screen starts at the top.
  useEffect(() => {
    top.current?.scrollIntoView({ block: "start" });
  }, [step.name]);

  return (
    <main className="mx-auto grid w-full max-w-xl gap-6 px-4 py-6">
      <div ref={top} />
      {step.name === "home" && <Home intro={intro} onStart={() => { markIntroSeen(); setIntro(false); setStep({ name: "camera" }); }} />}
      {step.name === "camera" && <Camera onShot={(shot) => setStep({ name: "review", shot })} onClose={() => setStep({ name: "home" })} />}
      {step.name === "review" && <Review shot={step.shot} onRetake={() => setStep({ name: "camera" })} onUse={(note) => setStep({ name: "checking", shot: step.shot, note })} />}
      {step.name === "checking" && <Checking shot={step.shot} note={step.note} onResult={(result) => setStep(result.verdict === "fixable" ? { name: "draft", shot: step.shot, result } : { name: "verdict", shot: step.shot, result })} onError={(e) => setStep({ name: "error", shot: step.shot, note: step.note, message: e.message, code: e instanceof ReportApiError ? e.code : undefined })} />}
      {step.name === "error" && <ErrorCard step={step} onRetry={() => setStep({ name: "checking", shot: step.shot, note: step.note })} onRetake={() => setStep({ name: "camera" })} onHome={() => setStep({ name: "home" })} />}
      {step.name === "verdict" && <VerdictCard result={step.result} onRetake={() => setStep({ name: "camera" })} onHome={() => setStep({ name: "home" })} />}
      {step.name === "draft" && <Draft shot={step.shot} result={step.result} onDone={(caseId, followed) => setStep({ name: "done", caseId, followed })} onCancel={() => setStep({ name: "home" })} />}
      {step.name === "done" && <Done followed={step.followed} caseId={step.caseId} onBack={() => setStep({ name: "home" })} />}
      {(step.name === "home" || step.name === "done") && <MyReports highlight={step.name === "done" ? step.caseId : undefined} />}
    </main>
  );
}

function Home({ intro, onStart }: { intro: boolean; onStart: () => void }) {
  return (
    <section className={card}>
      <div>
        <h1 className="font-serif text-2xl font-semibold">{content.promise}</h1>
        <p className="mt-1 text-sm text-taupe">{content.promiseBody}</p>
      </div>
      <Button size="lg" onClick={onStart}>
        <CameraIcon /> {content.takePhoto}
      </Button>
      {intro && (
        <ol className="grid gap-2 text-sm">
          {content.steps.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-graphite text-xs text-ivory">{i + 1}</span>
              <span><strong>{s.title}.</strong> <span className="text-taupe">{s.body}</span></span>
            </li>
          ))}
        </ol>
      )}
      <p className="text-xs text-taupe">{content.permissionNote}</p>
      <p className="rounded-xl bg-paper p-3 text-xs text-taupe">{content.demoNote}</p>
    </section>
  );
}

function Review({ shot, onUse, onRetake }: { shot: Shot; onUse: (note: string) => void; onRetake: () => void }) {
  const [note, setNote] = useState("");
  return (
    <section className={card}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shot.dataUrl} alt="Your photo" className="aspect-[3/4] w-full rounded-2xl object-cover sm:aspect-video" />
      <p className="flex items-center gap-1.5 text-xs text-taupe"><MapPin className="size-3.5" /> {content.camera.located(shot.accuracy)}</p>
      <label className="grid gap-1 text-sm">
        <span className="text-taupe">{content.review.note}</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={2} className="rounded-xl border border-hairline bg-paper p-2 text-graphite outline-none focus-visible:ring-2 focus-visible:ring-graphite/40" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={onRetake}>{content.review.retake}</Button>
        <Button onClick={() => onUse(note)}>{content.review.use}</Button>
      </div>
    </section>
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
      .catch((e) => live && onError(e instanceof Error ? e : new Error("Something went wrong. Nothing was sent.")));
    return () => { live = false; };
    // run once per step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <section className={card} aria-live="polite">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shot.dataUrl} alt="" className="aspect-video w-full rounded-2xl object-cover opacity-70" />
      <p className="text-center text-sm text-taupe">{content.checking[i]}</p>
    </section>
  );
}

function ErrorCard({ step, onRetry, onRetake, onHome }: { step: Extract<Step, { name: "error" }>; onRetry: () => void; onRetake: () => void; onHome: () => void }) {
  // These are problems with the photo's place or the connection, not with the report itself.
  const retakeHelps = step.code === "location_inaccurate" || step.code === "no_location" || step.code === "bad_image";
  const final = step.code === "outside_boston";
  return (
    <section className={card} role="alert">
      <p className="flex items-center gap-2 font-medium"><AlertTriangle className="size-4" /> {step.message}</p>
      <p className="text-sm text-taupe">Nothing was sent.</p>
      <div className="grid grid-cols-2 gap-3">
        {final ? <Button variant="outline" onClick={onHome}>{content.back}</Button> : retakeHelps ? <Button onClick={onRetake}>{content.review.retake}</Button> : <Button onClick={onRetry}><RefreshCw /> {content.retry}</Button>}
        {!final && <Button variant="outline" onClick={onHome}>{content.back}</Button>}
      </div>
    </section>
  );
}

function VerdictCard({ result, onRetake, onHome }: { result: CheckResult; onRetake: () => void; onHome: () => void }) {
  const [flagged, setFlagged] = useState(false);
  if (result.verdict === "emergency") {
    return (
      <section className={card} role="alert">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold"><AlertTriangle className="size-5" /> {content.verdict.emergency.title}</h2>
        <p className="text-sm">{content.verdict.emergency.body}</p>
        <Button onClick={() => (window.location.href = "tel:911")}><Phone /> {content.verdict.emergency.call}</Button>
        <Button variant="outline" onClick={onHome}>{content.back}</Button>
      </section>
    );
  }
  const v = result.verdict === "private" ? content.verdict.private : content.verdict.unclear;
  return (
    <section className={card}>
      <h2 className="font-serif text-xl font-semibold">{v.title}</h2>
      <p className="text-sm">{result.reason}</p>
      <p className="text-sm text-taupe">{v.next}</p>
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={onRetake}>{content.review.retake}</Button>
        <Button variant="outline" onClick={onHome}>{content.back}</Button>
      </div>
      {/* "I think this is wrong" is logged for review. It never forces a send. */}
      {flagged ? <p className="text-xs text-taupe">{content.verdict.wrongThanks}</p> : <button className="justify-self-start text-xs text-taupe underline underline-offset-4" onClick={() => setFlagged(true)}>{content.verdict.wrong}</button>}
    </section>
  );
}

function Draft({ shot, result, onDone, onCancel }: { shot: Shot; result: CheckResult; onDone: (caseId: string, followed: boolean) => void; onCancel: () => void }) {
  const [service, setService] = useState(result.serviceName);
  const [text, setText] = useState(result.description);
  // Results are keyed by category, so changing the category shows "loading" until its own answer arrives.
  const [found, setFound] = useState<{ service: string; data: NearbyCase[] | "failed" } | null>(null);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = useRef(crypto.randomUUID()); // one key per draft: a double tap never makes two cases
  const nearby = found?.service === service ? found.data : "loading";
  const dismissed = dismissedFor === service;

  useEffect(() => {
    let live = true;
    findNearby(shot.lat, shot.lng, service)
      .then((data) => live && setFound({ service, data }))
      .catch(() => live && setFound({ service, data: "failed" }));
    return () => { live = false; };
  }, [service, shot.lat, shot.lng]);

  const base = { serviceName: service, lat: shot.lat, lng: shot.lng, thumb: shot.thumb };

  function follow(n: NearbyCase) {
    const c: SavedCase = { ...base, createdAt: nowMs(), caseId: n.caseId, kind: "followed", team: n.team ?? teamFor(service), description: text || result.description || n.serviceName };
    saveCase(c);
    onDone(c.caseId, true);
  }

  async function send() {
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      const r = await sendReport({ serviceName: service, description: text.trim(), lat: shot.lat, lng: shot.lng, key: key.current });
      saveCase({ ...base, createdAt: nowMs(), caseId: r.caseId, kind: "demo", team: r.team, description: text.trim() });
      onDone(r.caseId, false);
    } catch (e) {
      setError(e instanceof Error ? e.message : content.draft.sendFailed);
      setSending(false);
    }
  }

  const dupes = Array.isArray(nearby) && nearby.length > 0 && !dismissed ? nearby : null;
  const tooShort = text.trim().length < 10;

  return (
    <section className={card}>
      <h2 className="font-serif text-xl font-semibold">{content.draft.title}</h2>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shot.dataUrl} alt="Your photo" className="aspect-video w-full rounded-2xl object-cover" />

      {nearby === "failed" && <p className="rounded-xl bg-paper p-3 text-sm">{content.dupes.checkFailed}</p>}

      {dupes && (
        <div className="grid gap-3 rounded-2xl border border-leaf bg-paper p-4">
          <div>
            <h3 className="font-medium">{content.dupes.title}</h3>
            <p className="text-sm text-taupe">{content.dupes.body}</p>
          </div>
          <ul className="grid gap-2">
            {dupes.map((n) => (
              <li key={n.caseId} className="flex items-center justify-between gap-3 rounded-xl bg-ivory p-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{n.serviceName} · {n.team ?? "311"}</span>
                  <span className="text-xs text-taupe">{content.dupes.away(n.distanceM)}{n.openedAt ? ` · ${content.dupes.opened(new Date(n.openedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }))}` : ""}</span>
                </span>
                <Button size="sm" onClick={() => follow(n)}>{content.dupes.follow}</Button>
              </li>
            ))}
          </ul>
          <button className="justify-self-start text-sm underline underline-offset-4" onClick={() => setDismissedFor(service)}>{content.dupes.notSame}</button>
        </div>
      )}

      {!dupes && (
        <>
          <label className="grid gap-1 text-sm">
            <span className="text-taupe">{content.draft.category}</span>
            <select value={service} onChange={(e) => setService(e.target.value)} className="h-10 rounded-xl border border-hairline bg-paper px-2 text-graphite outline-none focus-visible:ring-2 focus-visible:ring-graphite/40">
              {CATEGORIES.map((c) => <option key={c.name}>{c.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-taupe">{content.draft.description}</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={600} rows={4} aria-describedby="hint" className="rounded-xl border border-hairline bg-paper p-2 text-graphite outline-none focus-visible:ring-2 focus-visible:ring-graphite/40" />
            <span id="hint" className="text-xs text-taupe">{content.draft.descriptionHint}</span>
          </label>
          {PERSONAL.test(text) && <p className="text-sm text-cherry" role="status">{content.draft.personal}</p>}
          <div className="grid gap-1 text-xs text-taupe">
            <p><strong className="text-graphite">{content.draft.goesTo(teamFor(service))}</strong></p>
            <p className="flex items-center gap-1"><MapPin className="size-3.5" /> {content.draft.pin}</p>
            <p>{content.draft.anonymous}</p>
          </div>
          {tooShort && <p className="text-xs text-taupe">{content.draft.tooShort}</p>}
          {error && <p className="text-sm text-cherry" role="alert">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={onCancel}>{content.draft.cancel}</Button>
            <Button onClick={send} disabled={tooShort || sending || nearby === "loading"}>{sending ? content.draft.sending : content.draft.send}</Button>
          </div>
        </>
      )}
    </section>
  );
}

function Done({ followed, caseId, onBack }: { followed: boolean; caseId: string; onBack: () => void }) {
  return (
    <section className={card} aria-live="polite">
      <h2 className="font-serif text-xl font-semibold">{followed ? content.followedTitle : content.sentTitle}</h2>
      <p className="text-sm text-taupe">{caseId} · {content.sentBody}</p>
      {!followed && <p className="rounded-xl bg-paper p-3 text-xs text-taupe">{content.demoNote}</p>}
      <Button variant="outline" onClick={onBack}>{content.back}</Button>
    </section>
  );
}
