"use client";

import { useRef, useState } from "react";
import { Check, ChevronRight, MapPin } from "lucide-react";
import { sendReport } from "./api";
import type { Shot } from "./Camera";
import { CATEGORIES } from "./categories";
import { content, OFFICIAL_311 } from "./content";
import { KnittedControl } from "./Knitted";
import { nowMs, saveCase } from "./store";
import { Disclosure, field, PrimaryButton, SecondaryButton } from "./ui";
import type { CheckResult } from "./types";

const PERSONAL = /(\+?\d[\d\s().-]{8,}\d)|([\w.+-]+@[\w-]+\.[\w.-]+)/;

type Where = { lat: number; lng: number; accuracy: number };

/**
 * Guided preparation. Nothing is filed from here: the main action copies the text and opens Boston 311, where the person
 * submits it themselves. "Save demo report" is a separate, clearly labelled local save.
 */
export function Prepare({ shot, result, service: first, onBack, onSaved, onRetake, onHome }: { shot: Shot; result: CheckResult; service: string; onBack: () => void; onSaved: (caseId: string) => void; onRetake: () => void; onHome: () => void }) {
  const [service, setService] = useState(first);
  const [text, setText] = useState(result.description);
  const [where, setWhere] = useState<Where>({ lat: shot.lat, lng: shot.lng, accuracy: shot.accuracy });
  const [locMsg, setLocMsg] = useState<string | null>(null);
  const [locBusy, setLocBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handed, setHanded] = useState<null | "ok" | "blocked" | "copyfail">(null);
  const key = useRef(crypto.randomUUID()); // one key per draft: a double tap never makes two cases

  const tooShort = text.trim().length < 10;

  function refreshLocation() {
    if (!navigator.geolocation) return setLocMsg(content.prepare.locationBlocked);
    setLocBusy(true);
    setLocMsg(null);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocBusy(false);
        if (p.coords.accuracy > 50) return setLocMsg(content.prepare.locationTooFuzzy);
        setWhere({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy });
      },
      () => {
        setLocBusy(false);
        setLocMsg(content.prepare.locationBlocked);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function handoff() {
    if (tooShort) return;
    let copied = false;
    try {
      await navigator.clipboard.writeText(`${service}: ${text.trim()}`);
      copied = true;
    } catch {
      copied = false;
    }
    const w = window.open(OFFICIAL_311, "_blank");
    if (w) w.opener = null;
    setHanded(!copied ? "copyfail" : w ? "ok" : "blocked");
  }

  async function save() {
    if (saving || tooShort) return;
    setSaving(true);
    setError(null);
    try {
      const r = await sendReport({ serviceName: service, description: text.trim(), lat: where.lat, lng: where.lng, key: key.current });
      saveCase({ serviceName: service, lat: where.lat, lng: where.lng, thumb: shot.thumb, createdAt: nowMs(), caseId: r.caseId, kind: "demo", team: r.team, description: text.trim(), lastStage: "sent" });
      onSaved(r.caseId);
    } catch (e) {
      setError(e instanceof Error ? e.message : content.prepare.saveFailed);
      setSaving(false);
    }
  }

  if (handed) {
    return (
      <section className="mx-auto grid w-full max-w-xl gap-4 rounded-3xl border border-hairline bg-ivory p-5 shadow-float motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200" aria-live="polite">
        <h1 className="flex items-center gap-2 font-serif text-3xl leading-tight font-semibold">
          {handed !== "copyfail" && <Check className="size-6 text-cat-verify" aria-hidden />}
          {handed === "copyfail" ? content.prepare.copyFailedTitle : content.prepare.handedTitle}
        </h1>
        <p>{handed === "ok" ? content.prepare.handedBody : handed === "blocked" ? content.prepare.handedBlocked : content.prepare.copyFailed}</p>
        <blockquote className="rounded-xl bg-stone-deep/40 p-3 text-sm">{`${service}: ${text.trim()}`}</blockquote>
        <PrimaryButton onClick={onHome}>{content.prepare.done}</PrimaryButton>
      </section>
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-xl gap-5 rounded-3xl border border-hairline bg-ivory p-5 shadow-float motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
      <button type="button" onClick={onBack} className="flex w-fit items-center gap-1 rounded-full pr-3 text-sm text-taupe outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/50">
        <KnittedControl name="back" className="size-9" /> {content.back}
      </button>
      <div className="flex gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={shot.thumb} alt="" className="size-16 shrink-0 rounded-2xl object-cover" />
        <div>
          <h1 className="font-serif text-3xl leading-tight font-semibold">{content.prepare.title}</h1>
          <p className="text-sm text-taupe">{content.prepare.body}</p>
        </div>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="text-taupe">{content.prepare.issue}</span>
        <select value={service} onChange={(e) => setService(e.target.value)} className={`${field} h-11`}>
          {CATEGORIES.map((c) => (
            <option key={c.name}>{c.name}</option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-taupe">{content.prepare.description}</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={600} rows={4} aria-describedby="prep-hint" className={field} />
        <span id="prep-hint" className="text-xs text-taupe">
          {PERSONAL.test(text) ? <span className="text-graphite">{content.prepare.personal}</span> : tooShort ? content.prepare.tooShort : content.prepare.descriptionHint}
        </span>
      </label>

      <Disclosure
        summary={
          <span className="flex items-center gap-2 text-graphite">
            <MapPin className="size-4 text-taupe" aria-hidden />
            <span className="flex-1">{content.prepare.whereNear(where.accuracy)}</span>
            <ChevronRight className="size-4 text-taupe transition-transform group-open:rotate-90 motion-reduce:transition-none" aria-hidden />
          </span>
        }
      >
        <p>{content.prepare.whereWhy}</p>
        <p className="text-xs">
          {where.lat.toFixed(4)}, {where.lng.toFixed(4)}
        </p>
        <div className="flex flex-wrap gap-2">
          <SecondaryButton className="min-h-9 px-4 text-sm" onClick={refreshLocation} disabled={locBusy}>
            {locBusy ? content.prepare.locating : content.prepare.useCurrent}
          </SecondaryButton>
          <SecondaryButton className="min-h-9 px-4 text-sm" onClick={onRetake}>
            {content.prepare.retakeThere}
          </SecondaryButton>
        </div>
        {locMsg && (
          <p role="status" className="text-xs text-graphite">
            {locMsg}
          </p>
        )}
      </Disclosure>

      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}

      <div className="grid gap-2">
        <PrimaryButton className="h-12 w-full" onClick={handoff} disabled={tooShort}>
          {content.prepare.handoff}
        </PrimaryButton>
        <p className="text-xs text-taupe">{content.prepare.handoffNote}</p>
      </div>
      <div className="grid gap-1 border-t border-hairline pt-4">
        <SecondaryButton className="w-full" onClick={save} disabled={tooShort || saving}>
          {saving ? content.prepare.saving : content.prepare.save}
        </SecondaryButton>
        <p className="text-center text-xs text-taupe">{content.prepare.saveNote}</p>
      </div>
    </section>
  );
}
