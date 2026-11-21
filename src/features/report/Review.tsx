"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight, Landmark, MapPin, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { findNearby, sendReport } from "./api";
import type { Shot } from "./Camera";
import { CATEGORIES, teamFor } from "./categories";
import { content, OFFICIAL_311 } from "./content";
import { nowMs, saveCase } from "./store";
import { Chip, Disclosure, field, Panel, PrimaryButton, SecondaryButton } from "./ui";
import type { CheckResult, NearbyCase, SavedCase } from "./types";

const PERSONAL = /(\+?\d[\d\s().-]{8,}\d)|([\w.+-]+@[\w-]+\.[\w.-]+)/;
const shortDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");

type Where = { lat: number; lng: number; accuracy: number };

/**
 * The AI review. The AI only suggests: the user can change the issue, the words and the spot, and nothing is saved until they say so.
 * Duplicates are shown as "possibly the same", because place and type cannot prove two reports are one problem.
 */
export function Review({ shot, result, onDone, onRetake, onCancel }: { shot: Shot; result: CheckResult; onDone: (caseId: string, followed: boolean) => void; onRetake: () => void; onCancel: () => void }) {
  const [service, setService] = useState(result.serviceName);
  const [text, setText] = useState(result.description);
  const [confirmed, setConfirmed] = useState(result.confidence === "high");
  const [where, setWhere] = useState<Where>({ lat: shot.lat, lng: shot.lng, accuracy: shot.accuracy });
  const [locMsg, setLocMsg] = useState<string | null>(null);
  const [locBusy, setLocBusy] = useState(false);
  // Results are keyed by category and spot, so a change shows "loading" until its own answer arrives.
  const lookup = `${service}|${where.lat}|${where.lng}`;
  const [found, setFound] = useState<{ key: string; data: NearbyCase[] | "failed" } | null>(null);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const key = useRef(crypto.randomUUID()); // one key per draft: a double tap never makes two cases

  const nearby = found?.key === lookup ? found.data : "loading";
  const dismissed = dismissedFor === lookup;

  useEffect(() => {
    let live = true;
    findNearby(where.lat, where.lng, service)
      .then((data) => live && setFound({ key: lookup, data }))
      .catch(() => live && setFound({ key: lookup, data: "failed" }));
    return () => {
      live = false;
    };
  }, [lookup, service, where.lat, where.lng]);

  const base = { serviceName: service, lat: where.lat, lng: where.lng, thumb: shot.thumb };

  function follow(n: NearbyCase) {
    const c: SavedCase = { ...base, createdAt: nowMs(), caseId: n.caseId, kind: "followed", team: n.team ?? teamFor(service), description: text || n.serviceName, lastStage: "in_progress" };
    saveCase(c);
    onDone(c.caseId, true);
  }

  async function save() {
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      const r = await sendReport({ serviceName: service, description: text.trim(), lat: where.lat, lng: where.lng, key: key.current });
      saveCase({ ...base, createdAt: nowMs(), caseId: r.caseId, kind: "demo", team: r.team, description: text.trim(), lastStage: "sent" });
      onDone(r.caseId, false);
    } catch (e) {
      setError(e instanceof Error ? e.message : content.review.saveFailed);
      setSending(false);
    }
  }

  function refreshLocation() {
    if (!navigator.geolocation) return setLocMsg(content.review.locationBlocked);
    setLocBusy(true);
    setLocMsg(null);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocBusy(false);
        if (p.coords.accuracy > 50) return setLocMsg(content.review.locationTooFuzzy);
        setWhere({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy });
      },
      () => {
        setLocBusy(false);
        setLocMsg(content.review.locationBlocked);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${service}: ${text.trim()}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const matches = Array.isArray(nearby) && nearby.length > 0 && !dismissed ? nearby : null;
  const tooShort = text.trim().length < 10;
  const canSave = !tooShort && !sending && nearby !== "loading" && confirmed;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] md:items-start">
      <div className="relative overflow-hidden rounded-3xl border border-hairline bg-stone-deep shadow-float md:sticky md:top-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={shot.dataUrl} alt="Your photo" className="aspect-[4/3] max-h-64 w-full object-cover md:max-h-none" />
        <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-ivory/85 px-3 py-1.5 text-xs backdrop-blur-md">
          <MapPin className="size-3.5" aria-hidden /> {content.camera.located(where.accuracy)}
        </span>
      </div>

      <Panel className="grid gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
              <Sparkles className="size-5 text-taupe" aria-hidden /> {content.review.title}
            </h2>
            <p className="text-xs text-taupe">{content.review.ai}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-2 py-1 text-sm text-taupe underline underline-offset-4 outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/50"
          >
            {content.review.cancel}
          </button>
        </div>

        {matches ? (
          <DuplicateCard cases={matches} service={service} onFollow={follow} onDifferent={() => setDismissedFor(lookup)} />
        ) : (
          <>
            {result.confidence === "low" && (
              <div className="grid gap-2 rounded-2xl bg-stone-deep/50 p-3 text-sm" role="note">
                <p>{content.review.lowConfidence}</p>
                {result.alternatives.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {result.alternatives.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          setService(a);
                          setConfirmed(true);
                        }}
                        className="rounded-full border border-hairline bg-ivory px-3 py-1 text-xs outline-none hover:bg-stone-deep/50 focus-visible:ring-2 focus-visible:ring-graphite/50"
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                )}
                {!confirmed ? (
                  <SecondaryButton className="min-h-9 justify-self-start px-4 text-sm" onClick={() => setConfirmed(true)}>
                    {content.review.keep(service)}
                  </SecondaryButton>
                ) : (
                  <p className="flex items-center gap-1 text-xs text-taupe">
                    <Check className="size-3.5" aria-hidden /> {content.review.confirmed}
                  </p>
                )}
              </div>
            )}

            <label className="grid gap-1 text-sm">
              <span className="text-taupe">{content.review.issue}</span>
              <select
                value={service}
                onChange={(e) => {
                  setService(e.target.value);
                  setConfirmed(true);
                }}
                className={cn(field, "h-11")}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              <span className="text-taupe">{content.review.description}</span>
              <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={600} rows={3} aria-describedby="desc-hint" className={field} />
              <span id="desc-hint" className="text-xs text-taupe">
                {PERSONAL.test(text) ? <span className="text-graphite">{content.review.personal}</span> : tooShort ? content.review.tooShort : content.review.descriptionHint}
              </span>
            </label>

            <Disclosure
              summary={
                <span className="flex items-center gap-2 text-graphite">
                  <MapPin className="size-4 text-taupe" aria-hidden />
                  <span className="flex-1">{content.review.locationNear(where.accuracy)}</span>
                  <ChevronRight className="size-4 text-taupe transition-transform group-open:rotate-90 motion-reduce:transition-none" aria-hidden />
                </span>
              }
            >
              <p>{content.review.locationWhy}</p>
              <p className="text-xs">
                {where.lat.toFixed(4)}, {where.lng.toFixed(4)}
              </p>
              <div className="flex flex-wrap gap-2">
                <SecondaryButton className="min-h-9 px-4 text-sm" onClick={refreshLocation} disabled={locBusy}>
                  {locBusy ? content.review.locating : content.review.useCurrent}
                </SecondaryButton>
                <SecondaryButton className="min-h-9 px-4 text-sm" onClick={onRetake}>
                  {content.review.retakeThere}
                </SecondaryButton>
              </div>
              {locMsg && (
                <p role="status" className="text-xs text-graphite">
                  {locMsg}
                </p>
              )}
            </Disclosure>

            <div className="flex items-start gap-3 rounded-2xl bg-stone-deep/40 p-3 text-sm">
              <Landmark className="mt-0.5 size-4 shrink-0 text-taupe" aria-hidden />
              <p>
                <span className="text-taupe">{content.review.team}: </span>
                <strong>{teamFor(service)}</strong>
                <span className="block text-xs text-taupe">{content.review.teamNote}</span>
              </p>
            </div>

            {nearby === "failed" && (
              <p role="status" className="rounded-xl bg-stone-deep/50 px-3 py-2 text-xs text-taupe">
                {content.dupes.checkFailed}
              </p>
            )}
            {Array.isArray(nearby) && nearby.length === 0 && (
              <p className="flex items-center gap-1.5 text-xs text-taupe">
                <Check className="size-3.5" aria-hidden /> {content.review.noDuplicate}
              </p>
            )}

            {error && (
              <p role="alert" className="text-sm text-graphite">
                {error}
              </p>
            )}

            <div className="grid gap-2">
              <PrimaryButton onClick={save} disabled={!canSave}>
                {sending ? content.review.saving : content.review.save}
              </PrimaryButton>
              <p className="text-center text-xs text-taupe">{content.review.demoFoot}</p>
            </div>

            <Disclosure summary={content.review.officialSummary}>
              <p>{content.review.officialBody}</p>
              <div className="flex flex-wrap gap-2">
                <SecondaryButton className="min-h-9 px-4 text-sm" onClick={copy} disabled={tooShort}>
                  {copied ? content.review.copied : content.review.copy}
                </SecondaryButton>
                <a
                  href={OFFICIAL_311}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center rounded-full border border-hairline bg-ivory px-4 text-sm text-graphite outline-none hover:bg-stone-deep/50 focus-visible:ring-2 focus-visible:ring-graphite/50"
                >
                  {content.review.openOfficial}
                </a>
              </div>
            </Disclosure>
          </>
        )}
      </Panel>
    </div>
  );
}

function DuplicateCard({ cases, service, onFollow, onDifferent }: { cases: NearbyCase[]; service: string; onFollow: (n: NearbyCase) => void; onDifferent: () => void }) {
  const [first, ...rest] = cases;
  const rows: [string, string][] = [
    [content.dupes.category, first.serviceName],
    [content.dupes.distance, content.dupes.away(first.distanceM)],
    [content.dupes.status, first.status || "—"],
    [content.dupes.team, first.team ?? "—"],
    [content.dupes.opened, shortDate(first.openedAt) || "—"],
  ];
  return (
    <div className="grid gap-3" role="group" aria-labelledby="dupe-title">
      <div>
        <h3 id="dupe-title" className="font-medium">
          {content.dupes.title}
        </h3>
        <p className="text-sm text-taupe">{content.dupes.body}</p>
      </div>
      <div className="rounded-2xl border border-hairline bg-ivory p-3 text-sm">
        <p className="mb-2 flex items-center justify-between gap-2 text-xs text-taupe">
          <span>
            {content.dupes.yours}: <strong className="text-graphite">{service}</strong>
          </span>
          <Chip>{content.dupes.theirs}</Chip>
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-taupe">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="grid gap-2">
        <PrimaryButton onClick={() => onFollow(first)}>{content.dupes.follow}</PrimaryButton>
        <SecondaryButton onClick={onDifferent}>{content.dupes.different}</SecondaryButton>
      </div>
      {rest.length > 0 && (
        <Disclosure summary={content.dupes.more(rest.length)}>
          <ul className="grid gap-2">
            {rest.map((n) => (
              <li key={n.caseId} className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-ivory p-2.5 text-sm text-graphite">
                <span className="min-w-0">
                  <span className="block truncate">{n.serviceName}</span>
                  <span className="text-xs text-taupe">
                    {content.dupes.away(n.distanceM)} · {n.status}
                    {n.openedAt ? ` · ${shortDate(n.openedAt)}` : ""}
                  </span>
                </span>
                <SecondaryButton className="min-h-9 px-3 text-xs" onClick={() => onFollow(n)}>
                  {content.dupes.follow}
                </SecondaryButton>
              </li>
            ))}
          </ul>
        </Disclosure>
      )}
    </div>
  );
}
