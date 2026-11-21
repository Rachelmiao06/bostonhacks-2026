"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { content, fill } from "./content";
import { barPercent, formatDate, formatHours, formatMonth, formatPercent, kindLabel } from "./format";
import { useStats } from "./useStats";
import type { StatsResponse } from "./types";

export function Stats() {
  const { state, retry } = useStats();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">{content.title}</h1>
        <p className="text-paper/80">{content.intro}</p>
      </header>

      {state.kind === "loading" && <p className="font-pixel text-xs text-paper/70">{content.loading}</p>}

      {state.kind === "error" && (
        <Card>
          <CardHeader>
            <CardTitle>{content.errorTitle}</CardTitle>
            <CardDescription role="alert">{state.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={retry}>
              {content.retry}
            </Button>
          </CardContent>
        </Card>
      )}

      {(state.kind === "live" || state.kind === "sample") && (
        <>
          <SourceBanner state={state} />
          <Dashboard data={state.data} />
        </>
      )}
    </div>
  );
}

function SourceBanner({ state }: { state: Extract<ReturnType<typeof useStats>["state"], { kind: "live" | "sample" }> }) {
  if (state.kind === "live") {
    return (
      <p className="flex flex-wrap items-center gap-2 text-sm text-paper/80">
        <Pill tone="leaf">{content.liveBadge}</Pill>
        {content.updated} {formatDate(state.data.generatedAt)}
      </p>
    );
  }
  return (
    <div role="status" className="space-y-1 rounded-2xl border-2 border-ink bg-sun p-4 text-ink shadow-chip">
      <p className="flex flex-wrap items-center gap-2 font-bold">
        <Pill tone="paper">{content.sampleBadge}</Pill>
        {state.reason === "no_api" ? content.sampleNoApi : content.sampleNoDatabase}
      </p>
      <p className="text-sm">{content.sampleWarning}</p>
    </div>
  );
}

function Dashboard({ data }: { data: StatsResponse }) {
  const { outages, riders, dataNotes } = data;
  const windowDays = outages.timeToFix.windowDays;
  const monthMax = Math.max(0, ...outages.timeToFix.byMonth.map((m) => m.medianHours ?? 0));
  const medianMax = Math.max(0, ...outages.timeToFix.byKind.map((k) => k.medianHours ?? 0));

  return (
    <div className="space-y-8">
      <Section title={content.openTitle}>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <BigNumber value={String(outages.openNow.total)} label={content.openUnit} />
          <ul className="flex flex-wrap gap-2 pb-1">
            {Object.entries(outages.openNow.byKind).map(([kind, n]) => (
              <li key={kind}>
                <Pill tone="sky">
                  {kindLabel(kind)}: {n}
                </Pill>
              </li>
            ))}
          </ul>
        </div>
        <SubTitle>{content.longestTitle}</SubTitle>
        {outages.openNow.longestOpen.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-3">
            {outages.openNow.longestOpen.map((o) => (
              <li key={o.questId} className="flex items-start justify-between gap-4">
                <span>
                  <span className="font-bold">{o.stationName}</span>
                  <span className="block text-sm text-muted-foreground">{o.header}</span>
                </span>
                <span className="shrink-0 font-heading text-lg font-bold">
                  {o.daysOpen} <span className="text-sm font-normal text-muted-foreground">{content.daysOpen}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={content.fixTitle} intro={fill(content.fixIntro, { days: windowDays })}>
        {outages.timeToFix.byKind.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-4">
            {outages.timeToFix.byKind.map((k) => (
              <li key={k.kind} className="space-y-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-bold">{kindLabel(k.kind)}</span>
                  <span className="text-sm text-muted-foreground">
                    {content.median} {formatHours(k.medianHours)} · {content.slowest} {formatHours(k.p90Hours)} · {k.resolved} fixed
                  </span>
                </div>
                <Bar percent={barPercent(k.medianHours ?? 0, medianMax)} tone="sun" />
              </li>
            ))}
          </ul>
        )}
        <SubTitle>{content.byMonthTitle}</SubTitle>
        {outages.timeToFix.byMonth.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-2">
            {outages.timeToFix.byMonth.map((m) => (
              <li key={m.month} className="grid grid-cols-[5.5rem_1fr_5rem] items-center gap-3 text-sm">
                <span>{formatMonth(m.month)}</span>
                <Bar percent={barPercent(m.medianHours ?? 0, monthMax)} tone="sky" />
                <span className="text-right font-bold">{formatHours(m.medianHours)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div className="grid gap-8 md:grid-cols-2">
        <Section title={content.repeatTitle} intro={fill(content.repeatIntro, { days: windowDays })}>
          {outages.repeatOffenders.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-2">
              {outages.repeatOffenders.map((f) => (
                <li key={f.facilityId} className="flex justify-between gap-3">
                  <span>
                    <span className="font-bold">{f.stationName}</span>{" "}
                    <span className="text-sm text-muted-foreground">{kindLabel(f.kind)}</span>
                  </span>
                  <span className="shrink-0 font-bold">
                    {f.outages} {content.repeatUnit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={content.busiestTitle} intro={fill(content.busiestIntro, { days: windowDays })}>
          {outages.busiestStations.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-2">
              {outages.busiestStations.map((s) => {
                const max = Math.max(...outages.busiestStations.map((x) => x.outages));
                return (
                  <li key={s.stationName} className="space-y-1">
                    <div className="flex justify-between gap-3">
                      <span className="font-bold">{s.stationName}</span>
                      <span>{s.outages}</span>
                    </div>
                    <Bar percent={barPercent(s.outages, max)} tone="cherry" />
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>

      <Section title={content.ridersTitle}>
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Stat label={content.riders} value={String(riders.riders)} />
          <Stat label={content.completed} value={String(riders.completed)} />
          <Stat label={content.coverage} value={formatPercent(riders.coveragePercent)} />
          <Stat label={content.improved} value={formatPercent(riders.improvedByAiPercent)} />
          <Stat label={content.handoff} value={formatPercent(riders.handoffPercent)} />
          <Stat label={content.resolvedAfter} value={String(riders.resolvedAfterReport)} />
        </dl>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>{content.correlationNote}</li>
          <li>{content.handoffNote}</li>
          <li>{content.aiNote}</li>
        </ul>
      </Section>

      <Section title={content.notesTitle}>
        <p className="text-sm text-muted-foreground">
          {dataNotes.totalOutagesOnRecord.toLocaleString("en-US")} {content.onRecord}
          {dataNotes.archiveStartsAt && ` · ${content.since} ${formatDate(dataNotes.archiveStartsAt)}`} ·{" "}
          {dataNotes.liveSyncs} {content.syncs}
        </p>
        <p className="text-sm text-muted-foreground">
          {content.sourcesLabel}: {dataNotes.sources.join("; ")}
        </p>
      </Section>
    </div>
  );
}

function Section({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {intro && <CardDescription>{intro}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="pt-2 font-heading text-base font-bold">{children}</h3>;
}

function Empty() {
  return <p className="text-sm text-muted-foreground">{content.none}</p>;
}

function BigNumber({ value, label }: { value: string; label: string }) {
  return (
    <p>
      <span className="font-heading text-5xl font-bold">{value}</span>{" "}
      <span className="text-muted-foreground">{label}</span>
    </p>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-xl border-2 border-ink bg-muted p-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-heading text-2xl font-bold">{value}</dd>
    </div>
  );
}

const TONES = { sun: "bg-sun", sky: "bg-sky", cherry: "bg-cherry", leaf: "bg-leaf", paper: "bg-paper" } as const;

/** Decorative bar. The number is always written out next to it. */
function Bar({ percent, tone }: { percent: number; tone: "sun" | "sky" | "cherry" }) {
  return (
    <div aria-hidden className="h-3 overflow-hidden rounded-full border-2 border-ink bg-board/20">
      <div className={cn("h-full", TONES[tone])} style={{ width: `${percent}%` }} />
    </div>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone: keyof typeof TONES }) {
  return (
    <span className={cn("shrink-0 rounded-full border-2 border-ink px-3 py-0.5 text-xs font-bold whitespace-nowrap text-ink", TONES[tone])}>
      {children}
    </span>
  );
}
