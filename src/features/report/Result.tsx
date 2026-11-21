"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight, Landmark, MessageCircle, Search } from "lucide-react";
import { findNearby } from "./api";
import { AskTada } from "./AskTada";
import type { Shot } from "./Camera";
import { CATEGORIES, teamFor } from "./categories";
import { content } from "./content";
import { Sheet, PrimaryButton, SecondaryButton, field } from "./ui";
import type { CheckResult, NearbyCase } from "./types";

export type Analysis = { result: CheckResult; nearby: NearbyCase[] | "failed" };

const shortDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");

/**
 * Smart result for a Boston 311 matter. One of three things shows, chosen from the real backend output:
 *  F. the AI is unsure: pick the closest category first.
 *  B. a similar open case is nearby: the primary action is to follow it.
 *  A. otherwise: Boston 311 is the channel and the primary action is to prepare a report.
 */
export function Result({
  shot,
  analysis,
  initialService,
  onPrepare,
  onFollow,
  onCancel,
}: {
  shot: Shot;
  analysis: Analysis;
  initialService?: string;
  onPrepare: (service: string) => void;
  onFollow: (n: NearbyCase, service: string) => void;
  onCancel: () => void;
}) {
  const { result } = analysis;
  const [service, setService] = useState(initialService ?? result.serviceName);
  const [confirmed, setConfirmed] = useState(initialService !== undefined || result.confidence === "high");
  const [byService, setByService] = useState<Record<string, NearbyCase[] | "failed">>({ [result.serviceName]: analysis.nearby });
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"nearby" | "ask" | null>(null);

  // A different category means a different lookup. Results are cached per category.
  useEffect(() => {
    if (service in byService) return;
    let live = true;
    findNearby(shot.lat, shot.lng, service)
      .then((data) => live && setByService((m) => ({ ...m, [service]: data })))
      .catch(() => live && setByService((m) => ({ ...m, [service]: "failed" })));
    return () => {
      live = false;
    };
  }, [service, byService, shot.lat, shot.lng]);

  const near = byService[service];
  const matches = Array.isArray(near) && near.length > 0 && dismissedFor !== service ? near : null;

  const choose = (name: string) => {
    setService(name);
    setConfirmed(true);
  };

  if (!confirmed) {
    const options = [result.serviceName, ...result.alternatives].filter((v, i, a) => a.indexOf(v) === i && v !== "Other");
    return (
      <article className="mx-auto grid w-full max-w-xl gap-5 rounded-3xl border border-hairline bg-ivory p-5 shadow-float motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
        <div>
          <h1 className="font-serif text-3xl leading-tight font-semibold">{content.result.pick}</h1>
          <p className="mt-1 text-taupe">{content.result.pickBody}</p>
        </div>
        <ul className="grid gap-2">
          {options.map((o) => (
            <li key={o}>
              <button type="button" onClick={() => choose(o)} className="flex w-full items-center justify-between rounded-2xl border border-hairline px-4 py-3 text-left outline-none hover:bg-stone-deep/40 focus-visible:ring-2 focus-visible:ring-graphite/50">
                <span className="font-medium">{o}</span>
                <ChevronRight className="size-4 text-taupe" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <label className="grid gap-1 text-sm">
          <span className="text-taupe">{content.result.pickOther}</span>
          <select defaultValue="" onChange={(e) => e.target.value && choose(e.target.value)} className={`${field} h-11`}>
            <option value="" disabled>
              Choose…
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={onCancel} className="justify-self-start text-sm text-taupe underline underline-offset-4 outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/50">
          {content.startOver}
        </button>
      </article>
    );
  }

  const first = matches?.[0];
  // If the person picked a category themselves, do not dress it up with the AI's original wording.
  const changed = service !== result.serviceName;
  return (
    <article className="mx-auto w-full max-w-xl overflow-hidden rounded-3xl border border-hairline bg-ivory shadow-float motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shot.dataUrl} alt="Your photo" className="aspect-[16/10] max-h-48 w-full bg-stone-deep object-cover sm:aspect-[4/3] sm:max-h-72" />
      <div className="grid gap-5 p-5">
        {/* Level 1: what Tada found */}
        <div>
          <p className="flex items-center gap-1.5 text-sm font-medium text-cat-verify">
            <Check className="size-4" aria-hidden /> {changed ? content.result.chose : content.result.found}
          </p>
          <h1 className="mt-1 font-serif text-3xl leading-tight font-semibold text-balance sm:text-4xl">{changed ? service : result.headline}</h1>
          {!changed && result.explanation && <p className="mt-2 text-taupe">{result.explanation}</p>}
        </div>

        {/* Level 2: the one recommended next step */}
        {near === undefined ? (
          <p className="rounded-2xl bg-sage/70 p-4 text-sm text-taupe" role="status">
            {content.result.checking}
          </p>
        ) : first ? (
          <section className="grid gap-3 rounded-2xl bg-sage p-4" aria-label={content.result.similarLabel}>
            <div>
              <p className="text-xs font-medium tracking-wide text-taupe uppercase">{content.result.similarLabel}</p>
              <p className="mt-1 font-serif text-xl font-semibold">
                {first.serviceName}
                {first.team ? ` · ${first.team}` : ""}
              </p>
              <p className="text-sm">{content.result.caseLine(first.status || "Open", first.distanceM)}{first.openedAt ? ` · opened ${shortDate(first.openedAt)}` : ""}</p>
              <p className="mt-1 text-sm text-taupe">{content.result.similarBody}</p>
            </div>
            <PrimaryButton className="h-12 w-full" onClick={() => onFollow(first, service)}>
              {content.result.follow}
            </PrimaryButton>
            <button type="button" onClick={() => setDismissedFor(service)} className="justify-self-center text-sm underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-graphite/50">
              {content.result.different}
            </button>
          </section>
        ) : (
          <section className="grid gap-3 rounded-2xl bg-sage p-4" aria-label={content.result.helpLabel}>
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ivory" aria-hidden>
                <Landmark className="size-5 text-cat-verify" />
              </span>
              <div>
                <p className="text-xs font-medium tracking-wide text-taupe uppercase">{content.result.helpLabel}</p>
                <p className="font-serif text-2xl font-semibold">{content.result.boston}</p>
              </div>
            </div>
            <p className="text-sm">{content.result.bostonBody(service)}</p>
            <PrimaryButton className="h-12 w-full" onClick={() => onPrepare(service)}>
              {content.result.prepare}
            </PrimaryButton>
            <p className="text-xs text-taupe">{content.result.teamGuess(teamFor(service))}</p>
            {near === "failed" && (
              <p role="status" className="text-xs text-taupe">
                {content.result.lookupFailed}
              </p>
            )}
          </section>
        )}

        {/* Level 3: quiet extras */}
        <ul className="grid divide-y divide-hairline border-y border-hairline">
          <li>
            <button type="button" onClick={() => setSheet("nearby")} className="flex w-full items-center gap-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-graphite/50">
              <Search className="size-4 text-taupe" aria-hidden />
              <span className="flex-1 font-medium">{content.result.rowNearby}</span>
              <ChevronRight className="size-4 text-taupe" aria-hidden />
            </button>
          </li>
          <li>
            <button type="button" onClick={() => setSheet("ask")} className="flex w-full items-center gap-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-graphite/50">
              <MessageCircle className="size-4 text-taupe" aria-hidden />
              <span className="flex-1 font-medium">{content.result.rowAsk}</span>
              <ChevronRight className="size-4 text-taupe" aria-hidden />
            </button>
          </li>
        </ul>
        <button type="button" onClick={onCancel} className="justify-self-start text-sm text-taupe underline underline-offset-4 outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/50">
          {content.startOver}
        </button>
      </div>

      {sheet === "nearby" && (
        <Sheet title={content.nearby.title} onClose={() => setSheet(null)}>
          <p className="mb-3 text-sm text-taupe">{content.nearby.body}</p>
          {near === "failed" ? (
            <p className="text-sm">{content.nearby.failed}</p>
          ) : !Array.isArray(near) || near.length === 0 ? (
            <p className="text-sm">{content.nearby.none}</p>
          ) : (
            <ul className="grid gap-2">
              {near.map((n) => (
                <li key={n.caseId} className="flex items-center justify-between gap-3 rounded-xl border border-hairline p-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{n.serviceName}{n.team ? ` · ${n.team}` : ""}</span>
                    <span className="text-xs text-taupe">
                      {content.nearby.away(n.distanceM)} · {n.status}
                      {n.openedAt ? ` · ${shortDate(n.openedAt)}` : ""}
                    </span>
                  </span>
                  <SecondaryButton className="min-h-9 px-3 text-sm" onClick={() => onFollow(n, service)}>
                    {content.nearby.follow}
                  </SecondaryButton>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      )}
      {sheet === "ask" && <AskTada result={result} service={service} nearby={near ?? null} onClose={() => setSheet(null)} />}
    </article>
  );
}
