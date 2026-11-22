"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { QuestKind } from "@/lib/mbta";
import { cn } from "@/lib/utils";
import { categoryInfo, categoryStyle } from "@/features/explore/category";
import { categoryOfKind, kindLabels, type CategoryId } from "@/features/explore/content";
import type { MySubmission, MyVerification, ProgressState } from "@/features/explore/progress";
import { content, unlockSteps } from "./content";
import { glass } from "./glass";

const day = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");
const CHECKS_PER_PAGE = 4;
const FLIP_S = 0.9;

// Two pages side by side from `sm` up, one page on a phone.
const query = "(min-width: 640px)";
const subscribeWide = (cb: () => void) => {
  const m = window.matchMedia(query);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

type Props = {
  progress: ProgressState;
  /** Journey steps on the island now, or null when the rider's progress is not known. */
  known: number | null;
  onClose: () => void;
  onRetry: () => void;
};

type Flip = { dir: 1 | -1; to: number };

/**
 * The journal as an open book. Every report the rider sent (what they wrote, the coach's feedback, where it stands) and
 * every fix they checked is a page; turning a page flips it over the spine. Data is the server's (GET /api/submissions,
 * via useMyProgress): if it cannot be loaded the first page says so, it never passes off a failed load as an empty journal.
 */
export function JournalBook({ progress, known, onClose, onRetry }: Props) {
  const b = content.book;
  const still = useReducedMotion();
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(query).matches, () => true);
  const step = wide ? 2 : 1;

  const data = progress.status === "ready" ? progress.data : null;
  const reports = data ? [...data.submissions].sort((a, b) => (b.completed_at ?? b.updated_at).localeCompare(a.completed_at ?? a.updated_at)) : [];
  const checks = data ? data.verifications : [];

  // The pages, in order: contents, one per report, the checks (a few per page), a last page that says what adds more.
  const pages: { key: string; label: string; node: (num: number) => React.ReactNode }[] = [];
  const reportPage: number[] = [];
  let firstCheckPage = -1;
  const goTo = (p: number) => setIndex(wide ? p - (p % 2) : p);
  pages.push({
    key: "toc",
    label: b.toc,
    node: () => <TocPage progress={progress} known={known} reports={reports} checks={checks} reportPage={reportPage} firstCheckPage={() => firstCheckPage} goTo={goTo} onRetry={onRetry} />,
  });
  if (data) {
    reports.forEach((s, i) => {
      reportPage.push(pages.length);
      pages.push({ key: `r-${s.id}`, label: s.station_name ?? "", node: () => <ReportPage s={s} n={i + 1} total={reports.length} /> });
    });
    for (let i = 0; i < checks.length; i += CHECKS_PER_PAGE) {
      if (firstCheckPage < 0) firstCheckPage = pages.length;
      const chunk = checks.slice(i, i + CHECKS_PER_PAGE);
      pages.push({ key: `c-${i}`, label: b.checksTitle, node: () => <ChecksPage checks={chunk} /> });
    }
    pages.push({ key: "end", label: b.endTitle, node: () => <EndPage /> });
  }
  const n = pages.length;
  const pageAt = (i: number, side: "left" | "right" | "single") => {
    const p = pages[i];
    return <Paper side={side} num={p ? i + 1 : 0}>{p?.node(i + 1)}</Paper>;
  };

  const [index, setIndex] = useState(0);
  const [flip, setFlip] = useState<Flip | null>(null);
  const left = wide ? index - (index % 2) : index; // first page showing
  const last = wide ? Math.floor((n - 1) / 2) * 2 : n - 1;
  const at = Math.min(left, last);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (flip) return;
      const to = Math.min(Math.max(at + dir * step, 0), last);
      if (to === at) return;
      if (still) setIndex(to);
      else setFlip({ dir, to });
    },
    [flip, at, step, last, still],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  const shownTo = Math.min(at + step - 1, n - 1) + 1;
  const done = () => {
    if (flip) setIndex(flip.to);
    setFlip(null);
  };
  const turn = { duration: FLIP_S, ease: [0.45, 0.05, 0.25, 1] as [number, number, number, number] };

  // What sits under the turning leaf, and the leaf itself (front = the page that turns away, back = the page it lands on).
  let under: React.ReactNode;
  let leaf: React.ReactNode = null;
  if (wide) {
    if (!flip) under = (
      <>
        <Half side="left">{pageAt(at, "left")}</Half>
        <Half side="right">{pageAt(at + 1, "right")}</Half>
      </>
    );
    else {
      const fwd = flip.dir === 1;
      under = (
        <>
          <Half side="left">{pageAt(fwd ? at : at - 2, "left")}</Half>
          <Half side="right">{pageAt(fwd ? at + 3 : at + 1, "right")}</Half>
        </>
      );
      leaf = <Leaf fwd={fwd} turn={turn} onDone={done} front={pageAt(fwd ? at + 1 : at - 1, "right")} back={pageAt(fwd ? at + 2 : at, "left")} half />;
    }
  } else if (!flip) under = <div className="absolute inset-0">{pageAt(at, "single")}</div>;
  else {
    const fwd = flip.dir === 1;
    under = <div className="absolute inset-0">{pageAt(fwd ? at + 1 : at, "single")}</div>;
    leaf = <Leaf fwd={fwd} turn={turn} onDone={done} front={pageAt(fwd ? at : at - 1, "single")} back={<Paper side="single" num={0} />} />;
  }

  return (
    <div
      role="dialog"
      aria-label={b.label}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-linear-to-b from-ivory/70 via-ivory/55 to-ivory/70 px-3 pt-20 pb-4 font-ui text-graphite backdrop-blur-[5px]"
    >
      <motion.div
        initial={still ? false : { opacity: 0, y: 40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 16 }}
        className="relative"
        style={{ perspective: 2400 }}
      >
        {/* the cover peeking out around the pages, and a ribbon */}
        <div className={cn("relative h-[min(31rem,calc(100svh-12.5rem))] rounded-2xl bg-stone-deep p-1.5 shadow-float", wide ? "w-[min(47rem,calc(100vw-1.5rem))]" : "w-[min(24rem,calc(100vw-1.5rem))]")}>
          <span aria-hidden className="absolute -top-1 right-8 z-10 h-10 w-3.5 rounded-b-sm bg-cat-service shadow-float [clip-path:polygon(0_0,100%_0,100%_100%,50%_82%,0_100%)]" />
          <div className="relative h-full" style={{ transformStyle: "preserve-3d" }}>
            {under}
            {leaf}
            {wide && <span aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-px bg-graphite/15" />}
          </div>
          <button type="button" onClick={() => go(-1)} disabled={at <= 0 || !!flip} aria-label={b.prev} className={cornerButton("left-3")}>
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button type="button" onClick={() => go(1)} disabled={at >= last || !!flip} aria-label={b.next} className={cornerButton("right-3")}>
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </motion.div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="font-mono text-[0.68rem] text-taupe tabular-nums" aria-live="polite">
          {b.pages(at + 1, shownTo, n)}
        </span>
        <button data-autofocus type="button" onClick={onClose} className={`inline-flex h-9 cursor-pointer items-center rounded-full px-4 text-xs font-medium outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25 ${glass}`}>
          <span className="relative">{content.gift.back}</span>
        </button>
      </div>
    </div>
  );
}

const cornerButton = (pos: string) =>
  `absolute bottom-3 ${pos} z-30 grid size-8 cursor-pointer place-items-center rounded-full bg-ivory/90 text-graphite shadow-float outline-none hover:bg-ivory focus-visible:ring-4 focus-visible:ring-graphite/25 disabled:pointer-events-none disabled:opacity-0`;

/** One half of the spread. */
function Half({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
  return <div className={cn("absolute inset-y-0 w-1/2", side === "left" ? "left-0" : "right-0")}>{children}</div>;
}

/** The page that turns over the spine. Forward: it starts flat on the right and ends flat on the left. */
function Leaf({ fwd, turn, onDone, front, back, half }: { fwd: boolean; turn: object; onDone: () => void; front: React.ReactNode; back: React.ReactNode; half?: boolean }) {
  return (
    <motion.div
      initial={{ rotateY: fwd ? 0 : -180 }}
      animate={{ rotateY: fwd ? -180 : 0 }}
      transition={turn}
      onAnimationComplete={onDone}
      className={cn("absolute inset-y-0 z-10 origin-left", half ? "right-0 w-1/2" : "inset-x-0")}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="absolute inset-0 [backface-visibility:hidden]">{front}</div>
      <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">{back}</div>
    </motion.div>
  );
}

/** A sheet of paper: soft shading next to the spine, and the page number at the foot. */
function Paper({ side, num, children }: { side: "left" | "right" | "single"; num: number; children?: React.ReactNode }) {
  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-ivory", side === "left" && "rounded-l-lg", side === "right" && "rounded-r-lg", side === "single" && "rounded-lg")}>
      {side !== "single" && (
        <span aria-hidden className={cn("pointer-events-none absolute inset-y-0 z-10 w-12", side === "left" ? "right-0 bg-linear-to-l from-graphite/12 to-transparent" : "left-0 bg-linear-to-r from-graphite/12 to-transparent")} />
      )}
      <div className="relative h-full overflow-y-auto px-5 pt-5 pb-10">{children}</div>
      {num > 0 && <span className="pointer-events-none absolute inset-x-0 bottom-3 text-center font-mono text-[0.6rem] text-taupe tabular-nums">{num}</span>}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[0.6rem] tracking-[0.14em] text-taupe uppercase">{children}</p>;
}

function TocPage({
  progress,
  known,
  reports,
  checks,
  reportPage,
  firstCheckPage,
  goTo,
  onRetry,
}: {
  progress: ProgressState;
  known: number | null;
  reports: MySubmission[];
  checks: MyVerification[];
  reportPage: number[];
  firstCheckPage: () => number;
  goTo: (page: number) => void;
  onRetry: () => void;
}) {
  const h = content.history;
  const b = content.book;
  const ready = progress.status === "ready";
  const link = "flex w-full cursor-pointer items-baseline justify-between gap-2 rounded-lg px-2 py-1 text-left text-xs outline-none hover:bg-stone focus-visible:ring-2 focus-visible:ring-graphite/40";
  return (
    <div>
      <Kicker>{h.subtitle}</Kicker>
      <h2 className="mt-1 font-serif text-2xl leading-tight font-semibold">{h.title}</h2>
      {known !== null && (
        <p className="mt-1 text-xs text-taupe">
          {content.journey.summary(known, unlockSteps.length)}
          {known < unlockSteps.length && <span className="block">{content.journey.nextPiece(unlockSteps[known].name)}</span>}
        </p>
      )}
      <div className="mt-3 space-y-3 border-t border-dashed border-graphite/20 pt-3">
        {progress.status === "loading" && <p className="text-sm text-taupe">{h.loading}</p>}
        {progress.status === "unavailable" && (
          <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-taupe">
            {h.unavailable}
            <button type="button" onClick={onRetry} className="cursor-pointer rounded-full bg-graphite px-3 py-1 text-xs font-medium text-ivory outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25">
              {content.retry}
            </button>
          </p>
        )}
        {ready && reports.length === 0 && checks.length === 0 && <p className="text-sm text-taupe">{h.empty}</p>}
        {reports.length > 0 && (
          <section>
            <h3 className="flex items-baseline justify-between px-2 font-serif text-sm font-semibold">
              {h.reports}
              <span className="font-mono text-[0.65rem] font-normal text-taupe tabular-nums">{reports.length}</span>
            </h3>
            <ul className="mt-1">
              {reports.map((s, i) => (
                <li key={s.id}>
                  <button type="button" onClick={() => goTo(reportPage[i])} aria-label={b.turnTo(s.station_name ?? h.reports)} className={link}>
                    <span className="min-w-0 truncate">{s.station_name || kindLabel(s)}</span>
                    <span className="shrink-0 font-mono text-[0.6rem] text-taupe tabular-nums">p. {reportPage[i] + 1}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {checks.length > 0 && (
          <section>
            <button type="button" onClick={() => goTo(firstCheckPage())} aria-label={b.turnTo(h.checks)} className={cn(link, "font-serif text-sm font-semibold")}>
              {h.checks}
              <span className="font-mono text-[0.65rem] font-normal text-taupe tabular-nums">{checks.length}</span>
            </button>
          </section>
        )}
      </div>
      <p className="mt-4 text-[0.68rem] text-taupe">{h.honest}</p>
    </div>
  );
}

const kindLabel = (s: MySubmission) => (s.kind ? kindLabels[s.kind as QuestKind] : categoryInfo(categoryOf(s)).label);
const categoryOf = (s: MySubmission): CategoryId => categoryOfKind[(s.kind ?? "station") as QuestKind] ?? "station";

function ReportPage({ s, n, total }: { s: MySubmission; n: number; total: number }) {
  const h = content.history;
  const b = content.book;
  const category = categoryOf(s);
  const style = categoryStyle[category];
  const Icon = style.icon;
  const done = s.status === "completed";
  const status = done ? h.completed(day(s.completed_at)) : s.ai_status === "reviewed" ? h.passed : s.ai_status === "needs_revision" ? h.needsRevision : h.draft;
  const notes = [...(done && s.handed_off ? [h.handedOff] : []), ...(s.resolved_at ? [h.nowFixed] : []), ...((s.likes ?? 0) > 0 ? [b.likes(s.likes ?? 0)] : [])];
  const fb = s.ai_feedback;
  return (
    <article className="space-y-3 text-xs">
      <div className="flex items-center gap-2">
        <span className={cn("grid size-7 shrink-0 place-items-center rounded-full", style.soft)}>
          <Icon className={cn("size-3.5", style.text)} aria-hidden />
        </span>
        <div className="min-w-0">
          <Kicker>{b.reportOf(n, total)}</Kicker>
          <p className={cn("text-[0.7rem] font-semibold", style.text)}>{kindLabel(s)}</p>
        </div>
      </div>
      <div>
        <h2 className="font-serif text-xl leading-tight font-semibold">{s.station_name || kindLabel(s)}</h2>
        {s.header && <p className="mt-0.5 text-graphite/75">{s.header}</p>}
        <p className="mt-1 font-mono text-[0.6rem] tracking-wide text-taupe uppercase">
          {status}
          {!done && day(s.updated_at) ? ` · ${day(s.updated_at)}` : ""}
        </p>
      </div>
      <section>
        <h3 className="font-serif text-sm font-semibold">{b.youWrote}</h3>
        <p className="mt-1 rounded-xl border border-dashed border-graphite/25 bg-stone/60 px-3 py-2 leading-snug whitespace-pre-wrap">{s.text.trim() || b.noText}</p>
      </section>
      {fb && (
        <section>
          <h3 className="font-serif text-sm font-semibold">{b.coach}</h3>
          <p className="mt-1 leading-snug text-graphite/85">{fb.feedback}</p>
          {fb.suggestions.length > 0 && (
            <>
              <p className="mt-1.5 font-mono text-[0.6rem] tracking-wide text-taupe uppercase">{b.tryAdding}</p>
              <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-graphite/80">
                {fb.suggestions.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
      {notes.length > 0 && (
        <p className="flex flex-wrap gap-1">
          {notes.map((t) => (
            <span key={t} className="rounded-full bg-stone px-2 py-0.5 text-[0.64rem] text-taupe">
              {t}
            </span>
          ))}
        </p>
      )}
      {!done && !s.resolved_at && (
        <Link href={`/?quest=${encodeURIComponent(s.alert_id)}`} className="inline-flex items-center gap-1 font-medium underline decoration-graphite/30 underline-offset-4 hover:decoration-graphite">
          {h.viewOnMap} <ArrowRight className="size-3" aria-hidden />
        </Link>
      )}
    </article>
  );
}

function ChecksPage({ checks }: { checks: MyVerification[] }) {
  const h = content.history;
  const style = categoryStyle.verify;
  const Icon = style.icon;
  return (
    <div className="space-y-3">
      <Kicker>{h.subtitle}</Kicker>
      <h2 className="font-serif text-xl leading-tight font-semibold">{content.book.checksTitle}</h2>
      <ul className="space-y-3 text-xs">
        {checks.map((v) => (
          <li key={v.alert_id} className="flex gap-2.5">
            <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full", style.soft)}>
              <Icon className={cn("size-3", style.text)} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-serif text-sm leading-tight font-semibold">{v.station_name}</span>
              {v.header && <span className="block line-clamp-2 text-graphite/75">{v.header}</span>}
              <span className="block font-mono text-[0.6rem] tracking-wide text-taupe uppercase">{v.verdict === "working" ? h.working(day(v.created_at)) : h.stillBroken(day(v.created_at))}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EndPage() {
  const b = content.book;
  return (
    <div className="grid h-full content-center justify-items-start gap-2">
      <h2 className="font-serif text-xl leading-tight font-semibold">{b.endTitle}</h2>
      <p className="text-xs leading-snug text-taupe">{b.endBody}</p>
      <Link href="/" className="mt-1 inline-flex h-9 items-center rounded-full bg-graphite px-4 text-xs font-medium text-ivory outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25">
        {content.journey.contribute}
      </Link>
    </div>
  );
}
