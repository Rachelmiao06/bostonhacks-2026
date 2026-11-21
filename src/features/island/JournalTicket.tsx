"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { QuestKind } from "@/lib/mbta";
import { cn } from "@/lib/utils";
import { categoryInfo, categoryStyle } from "@/features/explore/category";
import { categoryOfKind, kindLabels, type CategoryId } from "@/features/explore/content";
import type { MySubmission, MyVerification, ProgressState } from "@/features/explore/progress";
import { TicketFrame, closeButtonClass } from "./TicketFrame";
import { content, unlockSteps } from "./content";
import type { IslandHandle } from "./IslandScene";

const day = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");

type Props = {
  progress: ProgressState;
  /** Journey steps on the island now, or null when the rider's progress is not known. */
  known: number | null;
  handle: React.RefObject<IslandHandle | null>;
  onClose: () => void;
  onRetry: () => void;
};

/**
 * The journal on the island: the rider's real reports and checks, from the server (GET /api/submissions), with the
 * status each one really has. If the history cannot be loaded it says so; it never shows an empty journal as proof of
 * "nothing done".
 */
export function JournalTicket({ progress, known, handle, onClose, onRetry }: Props) {
  const h = content.history;
  const data = progress.status === "ready" ? progress.data : null;
  const reports = data ? [...data.submissions].sort((a, b) => (b.completed_at ?? b.updated_at).localeCompare(a.completed_at ?? a.updated_at)) : [];
  const checks = data ? data.verifications : [];

  return (
    <TicketFrame id="journal" label={h.title} handle={handle} onClose={onClose}>
      <div className="p-4">
        <p className="font-mono text-[0.6rem] tracking-[0.14em] text-taupe uppercase">{h.subtitle}</p>
        <h2 className="mt-1 font-serif text-xl leading-tight font-semibold">{h.title}</h2>
        {known !== null && (
          <p className="text-xs text-taupe">
            {content.journey.summary(known, unlockSteps.length)}
            {known < unlockSteps.length && <span className="block">{content.journey.nextPiece(unlockSteps[known].name)}</span>}
          </p>
        )}

        <div className="mt-3 max-h-[min(20rem,48svh)] space-y-4 overflow-y-auto border-t border-dashed border-graphite/20 pt-3 pr-1">
          {progress.status === "loading" && <p className="text-sm text-taupe">{h.loading}</p>}
          {progress.status === "unavailable" && (
            <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-taupe">
              {h.unavailable}
              <button type="button" onClick={onRetry} className="cursor-pointer rounded-full bg-graphite px-3 py-1 text-xs font-medium text-ivory outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25">
                {content.retry}
              </button>
            </p>
          )}
          {data && reports.length === 0 && checks.length === 0 && <p className="text-sm text-taupe">{h.empty}</p>}
          {reports.length > 0 && (
            <Section title={h.reports} count={reports.length}>
              {reports.map((s) => (
                <ReportRow key={s.id} s={s} />
              ))}
            </Section>
          )}
          {checks.length > 0 && (
            <Section title={h.checks} count={checks.length}>
              {checks.map((v) => (
                <CheckRow key={v.alert_id} v={v} />
              ))}
            </Section>
          )}
        </div>

        <p className="mt-3 text-[0.68rem] text-taupe">{h.honest}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button data-autofocus type="button" onClick={onClose} className={closeButtonClass}>
            {content.gift.close}
          </button>
          <Link href="/" className="inline-flex h-9 items-center rounded-full border border-graphite/30 px-3 text-xs font-medium outline-none hover:border-graphite/60 focus-visible:ring-4 focus-visible:ring-graphite/20">
            {content.journey.contribute}
          </Link>
        </div>
      </div>
    </TicketFrame>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-baseline justify-between font-serif text-sm font-semibold">
        {title}
        <span className="font-mono text-[0.65rem] font-normal text-taupe tabular-nums">{count}</span>
      </h3>
      <ul className="space-y-2">{children}</ul>
    </section>
  );
}

function Row({ category, kind, station, header, status, notes, action }: { category: CategoryId; kind?: string; station: string; header: string; status: string; notes: string[]; action?: { href: string; label: string } }) {
  const style = categoryStyle[category];
  const Icon = style.icon;
  return (
    <li className="flex gap-2.5 text-xs">
      <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full", style.soft)}>
        <Icon className={cn("size-3", style.text)} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className={cn("block text-[0.65rem] font-semibold", style.text)}>{kind ?? categoryInfo(category).label}</span>
        <span className="block font-serif text-sm leading-tight font-semibold">{station}</span>
        {header && <span className="block line-clamp-1 text-graphite/75">{header}</span>}
        <span className="block font-mono text-[0.6rem] tracking-wide text-taupe uppercase">{status}</span>
        {notes.length > 0 && (
          <span className="flex flex-wrap gap-1 pt-0.5">
            {notes.map((n) => (
              <span key={n} className="rounded-full bg-stone px-2 py-0.5 text-[0.64rem] text-taupe">
                {n}
              </span>
            ))}
          </span>
        )}
        {action && (
          <Link href={action.href} className="inline-flex items-center gap-1 pt-0.5 font-medium underline decoration-graphite/30 underline-offset-4 hover:decoration-graphite">
            {action.label} <ArrowRight className="size-3" aria-hidden />
          </Link>
        )}
      </span>
    </li>
  );
}

function ReportRow({ s }: { s: MySubmission }) {
  const h = content.history;
  const category: CategoryId = categoryOfKind[(s.kind ?? "station") as QuestKind] ?? "station";
  const done = s.status === "completed";
  const status = done ? h.completed(day(s.completed_at)) : s.ai_status === "reviewed" ? h.passed : s.ai_status === "needs_revision" ? h.needsRevision : h.draft;
  const notes = [...(done && s.handed_off ? [h.handedOff] : []), ...(s.resolved_at ? [h.nowFixed] : [])];
  return (
    <Row
      category={category}
      kind={s.kind ? kindLabels[s.kind as QuestKind] : undefined}
      station={s.station_name ?? ""}
      header={s.header ?? ""}
      status={status}
      notes={notes}
      action={done || s.resolved_at ? undefined : { href: `/?quest=${encodeURIComponent(s.alert_id)}`, label: h.viewOnMap }}
    />
  );
}

function CheckRow({ v }: { v: MyVerification }) {
  const h = content.history;
  return <Row category="verify" station={v.station_name} header={v.header} status={v.verdict === "working" ? h.working(day(v.created_at)) : h.stillBroken(day(v.created_at))} notes={[]} />;
}
