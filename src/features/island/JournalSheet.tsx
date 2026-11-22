"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Caveat } from "next/font/google";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ChevronDown, Search, X } from "lucide-react";
import type { QuestKind } from "@/lib/mbta";
import { cn } from "@/lib/utils";
import { categoryInfo, categoryStyle } from "@/features/explore/category";
import { categoryOfKind, kindLabels, type CategoryId } from "@/features/explore/content";
import type { MySubmission, MyVerification, ProgressState } from "@/features/explore/progress";
import { content, unlockSteps } from "./content";
import { glass } from "./glass";

// A handwriting face, loaded only for this sheet.
const hand = Caveat({ subsets: ["latin"], display: "swap" });

const day = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");
const kindLabel = (s: MySubmission) => (s.kind ? kindLabels[s.kind as QuestKind] : categoryInfo(categoryOf(s)).label);
const categoryOf = (s: MySubmission): CategoryId => categoryOfKind[(s.kind ?? "station") as QuestKind] ?? "station";

type Entry =
  | { type: "report"; id: string; when: string; s: MySubmission }
  | { type: "check"; id: string; when: string; v: MyVerification };
type Filter = "all" | "report" | "check";

type Props = {
  progress: ProgressState;
  /** Journey steps on the island now, or null when the rider's progress is not known. */
  known: number | null;
  onClose: () => void;
  onRetry: () => void;
};

/**
 * The journal as one sheet of handwritten paper, unfolded over the island. Every report the rider sent and every fix they
 * checked is an entry, newest first; they can filter by kind, search, and open an entry to read what they wrote and what the
 * coach said. Data is the server's (GET /api/submissions, via useMyProgress): if it cannot be loaded the sheet says so, it
 * never passes off a failed load as an empty journal.
 */
export function JournalSheet({ progress, known, onClose, onRetry }: Props) {
  const t = content.sheet;
  const h = content.history;
  const still = useReducedMotion();
  const data = progress.status === "ready" ? progress.data : null;
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const entries = useMemo<Entry[]>(() => {
    if (!data) return [];
    const all: Entry[] = [
      ...data.submissions.map((s): Entry => ({ type: "report", id: `r-${s.id}`, when: s.completed_at ?? s.updated_at, s })),
      ...data.verifications.map((v): Entry => ({ type: "check", id: `c-${v.alert_id}`, when: v.created_at, v })),
    ];
    return all.sort((a, b) => b.when.localeCompare(a.when));
  }, [data]);

  const needle = q.trim().toLowerCase();
  const shown = entries.filter((e) => {
    if (filter !== "all" && e.type !== filter) return false;
    if (!needle) return true;
    const hay = e.type === "report" ? [e.s.station_name, e.s.header, e.s.text, kindLabel(e.s), e.s.ai_feedback?.feedback] : [e.v.station_name, e.v.header];
    return hay.some((x) => x?.toLowerCase().includes(needle));
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pill = (on: boolean) =>
    cn("cursor-pointer rounded-full px-3 py-0.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-graphite/40", on ? "bg-graphite text-ivory" : "bg-stone text-taupe hover:text-graphite");

  return (
    <div
      role="dialog"
      aria-label={t.label}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-linear-to-b from-ivory/70 via-ivory/55 to-ivory/70 px-3 pt-20 pb-4 font-ui text-graphite backdrop-blur-[5px]"
    >
      {/* The sheet unfolds from the top: it starts as a thin folded strip and opens out. */}
      <motion.div
        initial={still ? false : { opacity: 0, scaleY: 0.12, scaleX: 0.86, rotateX: -35 }}
        animate={{ opacity: 1, scaleY: 1, scaleX: 1, rotateX: 0, rotate: -0.4 }}
        transition={{ type: "spring", stiffness: 90, damping: 15, mass: 1.1 }}
        style={{ transformOrigin: "50% 0%", transformPerspective: 1600 }}
        className="relative flex h-[min(34rem,calc(100svh-12rem))] w-[min(34rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-md bg-ivory shadow-float"
      >
        {/* fold creases and the notebook margin */}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-graphite/6" />
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-graphite/6" />
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-graphite/4" />
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-16 w-px bg-cat-service/30" />
        <button
          type="button"
          onClick={onClose}
          aria-label={content.gift.close}
          className="absolute top-2 right-2 z-10 grid size-8 cursor-pointer place-items-center rounded-full bg-ivory/90 text-taupe outline-none hover:bg-stone hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/40"
        >
          <X className="size-4" aria-hidden />
        </button>

        <div className={cn("relative flex-1 overflow-y-auto pr-5 pb-6 pl-20", hand.className)}>
          <header className="pt-5">
            <h2 className="text-4xl leading-none font-bold">{t.title}</h2>
            <p className="mt-1 text-xl leading-tight text-taupe">{t.sub}</p>
            {known !== null && (
              <p className="mt-1 text-lg leading-tight text-taupe">
                {content.journey.summary(known, unlockSteps.length)}
                {known < unlockSteps.length && <span className="block">{content.journey.nextPiece(unlockSteps[known].name)}</span>}
              </p>
            )}
          </header>

          {progress.status === "loading" && <p className="mt-4 text-xl text-taupe">{h.loading}</p>}
          {progress.status === "unavailable" && (
            <p role="alert" className="mt-4 flex flex-wrap items-center gap-2 text-xl text-taupe">
              {h.unavailable}
              <button type="button" onClick={onRetry} className="cursor-pointer rounded-full bg-graphite px-3 py-0.5 font-ui text-xs font-medium text-ivory outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25">
                {content.retry}
              </button>
            </p>
          )}
          {data && entries.length === 0 && <p className="mt-4 text-xl text-taupe">{h.empty}</p>}

          {entries.length > 0 && (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 font-ui">
                <button type="button" onClick={() => setFilter("all")} aria-pressed={filter === "all"} className={pill(filter === "all")}>
                  {t.all}
                </button>
                <button type="button" onClick={() => setFilter("report")} aria-pressed={filter === "report"} className={pill(filter === "report")}>
                  {t.reports}
                </button>
                <button type="button" onClick={() => setFilter("check")} aria-pressed={filter === "check"} className={pill(filter === "check")}>
                  {t.checks}
                </button>
                <label className="relative ml-auto">
                  <span className="sr-only">{t.search}</span>
                  <Search className="pointer-events-none absolute top-1/2 left-2 size-3 -translate-y-1/2 text-taupe" aria-hidden />
                  <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t.search}
                    className="h-6 w-36 rounded-full border border-hairline bg-ivory pr-2 pl-6 text-xs outline-none placeholder:text-taupe focus-visible:ring-2 focus-visible:ring-graphite/40"
                  />
                </label>
              </div>
              <p className="mt-1 font-ui text-[0.68rem] text-taupe">{t.entries(shown.length)}</p>

              <ul className="mt-1">
                {shown.map((e) => (
                  <EntryRow key={e.id} e={e} open={openId === e.id} onToggle={() => setOpenId(openId === e.id ? null : e.id)} />
                ))}
              </ul>
              {shown.length === 0 && <p className="mt-3 text-xl text-taupe">{t.noMatch}</p>}
              <p className="mt-4 font-ui text-[0.68rem] text-taupe">{h.honest}</p>
            </>
          )}
        </div>
      </motion.div>

      <button data-autofocus type="button" onClick={onClose} className={`inline-flex h-9 cursor-pointer items-center rounded-full px-4 font-ui text-xs font-medium outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25 ${glass}`}>
        <span className="relative">{content.gift.back}</span>
      </button>
    </div>
  );
}

function EntryRow({ e, open, onToggle }: { e: Entry; open: boolean; onToggle: () => void }) {
  const t = content.sheet;
  const h = content.history;
  const isReport = e.type === "report";
  const category: CategoryId = isReport ? categoryOf(e.s) : "verify";
  const style = categoryStyle[category];
  const Icon = style.icon;
  const station = isReport ? e.s.station_name || kindLabel(e.s) : e.v.station_name;
  const title = isReport ? t.reportAt(station) : t.checkedFix(station);
  const done = isReport && e.s.status === "completed";
  const status = isReport
    ? done
      ? h.completed(day(e.s.completed_at))
      : e.s.ai_status === "reviewed"
        ? h.passed
        : e.s.ai_status === "needs_revision"
          ? h.needsRevision
          : h.draft
    : e.v.verdict === "working"
      ? h.working(day(e.v.created_at))
      : h.stillBroken(day(e.v.created_at));
  const notes = isReport ? [...(done && e.s.handed_off ? [h.handedOff] : []), ...(e.s.resolved_at ? [h.nowFixed] : []), ...((e.s.likes ?? 0) > 0 ? [t.likes(e.s.likes ?? 0)] : [])] : [];
  const fb = isReport ? e.s.ai_feedback : null;

  return (
    <li className="relative border-b border-dashed border-graphite/20 py-2">
      <span className="absolute top-3 -left-[4.1rem] w-12 text-right text-lg leading-none text-taupe">{day(e.when)}</span>
      <button type="button" onClick={onToggle} aria-expanded={open} aria-label={`${open ? t.close : t.open}: ${title}`} className="flex w-full cursor-pointer items-start gap-2 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-graphite/40">
        <span className={cn("mt-1 grid size-6 shrink-0 place-items-center rounded-full", style.soft)}>
          <Icon className={cn("size-3", style.text)} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-2xl leading-tight font-semibold">{title}</span>
          {isReport && e.s.header && <span className="block font-ui text-xs text-graphite/70">{e.s.header}</span>}
          {!open && isReport && e.s.text.trim() && <span className="mt-0.5 line-clamp-2 block text-xl leading-tight text-graphite/80">&ldquo;{e.s.text.trim()}&rdquo;</span>}
          <span className="mt-0.5 block font-ui text-[0.62rem] tracking-wide text-taupe uppercase">{status}</span>
        </span>
        <ChevronDown className={cn("mt-2 size-4 shrink-0 text-taupe transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div className="mt-1 space-y-2 pl-8">
          {isReport && (
            <>
              <div>
                <p className="font-ui text-[0.62rem] tracking-wide text-taupe uppercase">{t.youWrote}</p>
                <p className="text-xl leading-tight whitespace-pre-wrap">{e.s.text.trim() || t.noText}</p>
              </div>
              {fb && (
                <div>
                  <p className="font-ui text-[0.62rem] tracking-wide text-taupe uppercase">{t.coach}</p>
                  <p className="text-xl leading-tight text-graphite/85">{fb.feedback}</p>
                  {fb.suggestions.length > 0 && (
                    <>
                      <p className="mt-1 font-ui text-[0.62rem] tracking-wide text-taupe uppercase">{t.tryAdding}</p>
                      <ul className="list-disc pl-5 text-xl leading-tight text-graphite/80">
                        {fb.suggestions.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </>
          )}
          {!isReport && e.v.header && <p className="font-ui text-xs text-graphite/75">{e.v.header}</p>}
          {notes.length > 0 && (
            <p className="flex flex-wrap gap-1 font-ui">
              {notes.map((n) => (
                <span key={n} className="rounded-full bg-stone px-2 py-0.5 text-[0.64rem] text-taupe">
                  {n}
                </span>
              ))}
            </p>
          )}
          {isReport && !done && !e.s.resolved_at && (
            <Link href={`/?quest=${encodeURIComponent(e.s.alert_id)}`} className="inline-flex items-center gap-1 font-ui text-xs font-medium underline decoration-graphite/30 underline-offset-4 hover:decoration-graphite">
              {h.viewOnMap} <ArrowRight className="size-3" aria-hidden />
            </Link>
          )}
        </div>
      )}
    </li>
  );
}
