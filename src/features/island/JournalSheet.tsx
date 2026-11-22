"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Patrick_Hand } from "next/font/google";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { QuestKind } from "@/lib/mbta";
import { cn } from "@/lib/utils";
import { categoryInfo, categoryStyle } from "@/features/explore/category";
import { categoryOfKind, kindLabels, type CategoryId } from "@/features/explore/content";
import type { MySubmission, MyVerification, ProgressState } from "@/features/explore/progress";
import { content, unlockSteps } from "./content";
import { glass } from "./glass";
import { CheckTag, FolderSticker, HeartSticker, StarSticker } from "./Stickers";

// A tidy handwriting face for the planner, loaded only for this sheet.
const hand = Patrick_Hand({ subsets: ["latin"], weight: "400", display: "swap" });

const categoryOf = (s: MySubmission): CategoryId => categoryOfKind[(s.kind ?? "station") as QuestKind] ?? "station";
const kindLabel = (s: MySubmission) => (s.kind ? kindLabels[s.kind as QuestKind] : categoryInfo(categoryOf(s)).label);
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const monthName = (y: number, m: number, style: "long" | "short") => new Date(y, m, 1).toLocaleDateString("en-US", { month: style });

type Entry =
  | { type: "report"; id: string; at: Date; s: MySubmission }
  | { type: "check"; id: string; at: Date; v: MyVerification };

type Props = {
  progress: ProgressState;
  /** Journey steps on the island now, or null when the rider's progress is not known. */
  known: number | null;
  onClose: () => void;
  onRetry: () => void;
};

/** The stickers a day gets: a star for a finished report, a folder for one still open, a heart if it was liked, a ribbon per fix checked. */
function Stickers({ entries, small }: { entries: Entry[]; small?: boolean }) {
  const t = content.sheet;
  const size = small ? "size-4" : "size-5";
  const items: React.ReactNode[] = [];
  for (const e of entries) {
    if (e.type === "check") items.push(<CheckTag key={e.id} ok={e.v.verdict === "working"} label={e.v.verdict === "working" ? t.checkTag : t.brokenTag} />);
    else {
      items.push(e.s.status === "completed" ? <StarSticker key={e.id} className={size} /> : <FolderSticker key={e.id} className={size} />);
      if ((e.s.likes ?? 0) > 0) items.push(<HeartSticker key={`${e.id}-h`} className={size} />);
    }
  }
  const max = small ? 3 : 4;
  return (
    <span className="flex flex-wrap items-center justify-center gap-0.5">
      {items.slice(0, max)}
      {items.length > max && <span className="text-[0.65rem] text-taupe">+{items.length - max}</span>}
    </span>
  );
}

/**
 * The journal as a page from a planner: a month calendar (Monday first) with stickers on the days the rider did something.
 * Tap a day to read it (what they wrote, what the coach said, where it stands); the arrows and the month tabs go back through
 * the history. Data is the server's (GET /api/submissions, via useMyProgress): if it cannot be loaded the page says so, it
 * never passes off a failed load as an empty journal.
 */
export function JournalSheet({ progress, known, onClose, onRetry }: Props) {
  const t = content.sheet;
  const h = content.history;
  const still = useReducedMotion();
  const data = progress.status === "ready" ? progress.data : null;

  const entries = useMemo<Entry[]>(() => {
    if (!data) return [];
    return [
      ...data.submissions.map((s): Entry => ({ type: "report", id: `r-${s.id}`, at: new Date(s.completed_at ?? s.updated_at), s })),
      ...data.verifications.map((v): Entry => ({ type: "check", id: `c-${v.alert_id}`, at: new Date(v.created_at), v })),
    ].sort((a, b) => b.at.getTime() - a.at.getTime());
  }, [data]);
  const byDay = useMemo(() => {
    const m = new Map<string, Entry[]>();
    for (const e of entries) m.set(dayKey(e.at), [...(m.get(dayKey(e.at)) ?? []), e]);
    return m;
  }, [entries]);

  const today = new Date();
  const latest = entries[0]?.at ?? today;
  const earliest = entries.length ? entries[entries.length - 1].at : today;
  const [view, setView] = useState({ y: latest.getFullYear(), m: latest.getMonth() });
  const [picked, setPicked] = useState<string | null>(null);

  const monthIndex = (y: number, m: number) => y * 12 + m;
  const minIdx = monthIndex(earliest.getFullYear(), earliest.getMonth());
  const maxIdx = Math.max(monthIndex(today.getFullYear(), today.getMonth()), monthIndex(latest.getFullYear(), latest.getMonth()));
  const idx = monthIndex(view.y, view.m);
  const goTo = (i: number) => {
    setView({ y: Math.floor(i / 12), m: i % 12 });
    setPicked(null);
  };

  const days = new Date(view.y, view.m + 1, 0).getDate();
  const lead = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Monday first
  const monthEntries = entries.filter((e) => e.at.getFullYear() === view.y && e.at.getMonth() === view.m);
  const reportsN = monthEntries.filter((e) => e.type === "report").length;
  const checksN = monthEntries.length - reportsN;
  // The day being read: the one tapped, else the latest day with something on it this month.
  const lastDay = monthEntries[0] ? dayKey(monthEntries[0].at) : null;
  const sel = picked ?? lastDay;
  const selEntries = sel ? (byDay.get(sel) ?? []) : [];
  const selDate = selEntries[0]?.at;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const arrow = "grid size-8 cursor-pointer place-items-center rounded-full text-graphite outline-none hover:bg-stone focus-visible:ring-2 focus-visible:ring-graphite/40 disabled:pointer-events-none disabled:opacity-30";

  return (
    <div
      role="dialog"
      aria-label={t.label}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-linear-to-b from-ivory/70 via-ivory/55 to-ivory/70 px-3 pt-20 pb-4 font-ui text-graphite backdrop-blur-[5px]"
    >
      {/* The page unfolds from the top: it starts as a thin folded strip and opens out. */}
      <motion.div
        initial={still ? false : { opacity: 0, scaleY: 0.12, scaleX: 0.86, rotateX: -35 }}
        animate={{ opacity: 1, scaleY: 1, scaleX: 1, rotateX: 0, rotate: -0.3 }}
        transition={{ type: "spring", stiffness: 90, damping: 15, mass: 1.1 }}
        style={{ transformOrigin: "50% 0%", transformPerspective: 1600 }}
        className="relative flex h-[min(36rem,calc(100svh-12rem))] w-[min(35rem,calc(100vw-1.5rem))] overflow-hidden rounded-md bg-ivory shadow-float"
      >
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-graphite/5" />
        <button
          type="button"
          onClick={onClose}
          aria-label={content.gift.close}
          className="absolute top-2 right-2 z-10 grid size-8 cursor-pointer place-items-center rounded-full bg-ivory/90 text-taupe outline-none hover:bg-stone hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/40"
        >
          <X className="size-4" aria-hidden />
        </button>

        <div className={cn("relative min-w-0 flex-1 overflow-y-auto px-3 pt-4 pb-5 sm:px-5", hand.className)}>
          <header className="flex items-start gap-3 pr-9">
            <div>
              <p className="font-pixel text-[0.5rem] tracking-wide text-taupe uppercase">{t.sub}</p>
              <h2 className="text-3xl leading-tight">{t.title}</h2>
              {known !== null && <p className="text-base leading-tight text-taupe">{content.journey.summary(known, unlockSteps.length)}</p>}
            </div>
            <span aria-hidden className="mt-1 ml-auto flex shrink-0 -rotate-6 items-center">
              <FolderSticker className="size-9" />
              <StarSticker className="-ml-2 size-5 rotate-12" />
            </span>
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

          {data && entries.length > 0 && (
            <>
              {/* month bar */}
              <div className="mt-3 flex items-center justify-between border-b border-graphite/20 pb-1">
                <button type="button" aria-label={t.prevMonth} disabled={idx <= minIdx} onClick={() => goTo(idx - 1)} className={arrow}>
                  <ChevronLeft className="size-4" aria-hidden />
                </button>
                <div className="text-center" aria-live="polite">
                  <p className="font-pixel text-[0.6rem] tracking-wide uppercase">
                    {monthName(view.y, view.m, "long")} {view.y}
                  </p>
                  <p className="text-sm text-taupe">{t.summary(reportsN, checksN)}</p>
                </div>
                <button type="button" aria-label={t.nextMonth} disabled={idx >= maxIdx} onClick={() => goTo(idx + 1)} className={arrow}>
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>

              <div className="flex gap-2">
                {/* the month */}
                <div className="min-w-0 flex-1">
                  <div className="grid grid-cols-7 border-b border-graphite/15 text-center font-pixel text-[0.4rem] tracking-wide text-taupe uppercase">
                    {t.weekdays.map((d) => (
                      <span key={d} className="py-1">
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {Array.from({ length: lead }, (_, i) => (
                      <span key={`b${i}`} aria-hidden className="h-11 border-r border-b border-graphite/10 sm:h-14" />
                    ))}
                    {Array.from({ length: days }, (_, i) => {
                      const date = new Date(view.y, view.m, i + 1);
                      const key = dayKey(date);
                      const list = byDay.get(key) ?? [];
                      const isToday = key === dayKey(today);
                      const isSel = key === sel && list.length > 0;
                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={list.length === 0}
                          onClick={() => setPicked(key)}
                          aria-label={`${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}${list.length ? `, ${t.dayEntries(list.length)}` : ""}`}
                          aria-pressed={list.length ? isSel : undefined}
                          className={cn(
                            "relative flex h-11 flex-col items-center justify-center border-r border-b border-graphite/10 p-0.5 outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-graphite/40 sm:h-14",
                            list.length > 0 ? "cursor-pointer hover:bg-stone/70" : "cursor-default",
                            isSel && "bg-stone",
                          )}
                        >
                          <Stickers entries={list} small />
                          <span className={cn("absolute right-1 bottom-0.5 text-[0.62rem] leading-none text-taupe", isToday && "rounded-full bg-graphite px-1 py-0.5 text-ivory")}>{i + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* month tabs down the edge, like a planner */}
                <nav aria-label={t.monthTabs} className="hidden shrink-0 flex-col justify-between py-6 sm:flex">
                  {Array.from({ length: 12 }, (_, m) => {
                    const i = monthIndex(view.y, m);
                    const on = m === view.m;
                    const off = i < minIdx || i > maxIdx;
                    return (
                      <button
                        key={m}
                        type="button"
                        disabled={off}
                        onClick={() => goTo(i)}
                        aria-current={on ? "date" : undefined}
                        aria-label={`${monthName(view.y, m, "long")} ${view.y}`}
                        className={cn("cursor-pointer font-pixel text-[0.4rem] tracking-wide uppercase outline-none [writing-mode:vertical-rl] focus-visible:ring-2 focus-visible:ring-graphite/40 disabled:cursor-default", on ? "border-r-2 border-graphite text-graphite" : "text-taupe/70 hover:text-graphite disabled:opacity-40")}
                      >
                        {monthName(view.y, m, "short")}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* the day you tapped */}
              <section className="mt-3" aria-live="polite">
                {selDate ? (
                  <>
                    <h3 className="flex items-center gap-2 text-2xl leading-tight">
                      <span className="rounded-sm bg-cat-station/20 px-1.5">{selDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
                      <Stickers entries={selEntries} />
                    </h3>
                    <ul className="mt-1 space-y-3">
                      {selEntries.map((e) => (
                        <EntryNote key={e.id} e={e} />
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-xl text-taupe">{t.nothingMonth}</p>
                )}
                {selDate && !picked && monthEntries.length > selEntries.length && <p className="mt-2 text-base text-taupe">{t.pickDay}</p>}
              </section>
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

/** One thing that happened on the selected day, written out like a note under the date. */
function EntryNote({ e }: { e: Entry }) {
  const t = content.sheet;
  const h = content.history;
  const isReport = e.type === "report";
  const style = categoryStyle[isReport ? categoryOf(e.s) : "verify"];
  const station = isReport ? e.s.station_name || kindLabel(e.s) : e.v.station_name;
  const done = isReport && e.s.status === "completed";
  const day = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");
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
    <li className="border-b border-dashed border-graphite/20 pb-3 last:border-b-0">
      <p className="text-xl leading-tight">
        <span className={cn("mr-1.5 rounded-sm px-1.5 text-base", style.soft, style.text)}>{isReport ? kindLabel(e.s) : h.checks}</span>
        {isReport ? t.reportAt(station) : t.checkedFix(station)}
      </p>
      {isReport && e.s.header && <p className="font-ui text-xs text-graphite/70">{e.s.header}</p>}
      {!isReport && e.v.header && <p className="font-ui text-xs text-graphite/70">{e.v.header}</p>}
      <p className="mt-0.5 font-ui text-[0.62rem] tracking-wide text-taupe uppercase">{status}</p>
      {isReport && (
        <>
          <p className="mt-1.5 font-ui text-[0.62rem] tracking-wide text-taupe uppercase">{t.youWrote}</p>
          <p className="text-xl leading-tight whitespace-pre-wrap">{e.s.text.trim() || t.noText}</p>
          {fb && (
            <>
              <p className="mt-1.5 font-ui text-[0.62rem] tracking-wide text-taupe uppercase">{t.coach}</p>
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
            </>
          )}
        </>
      )}
      {notes.length > 0 && (
        <p className="mt-1.5 flex flex-wrap gap-1 font-ui">
          {notes.map((n) => (
            <span key={n} className="rounded-full bg-stone px-2 py-0.5 text-[0.64rem] text-taupe">
              {n}
            </span>
          ))}
        </p>
      )}
      {isReport && !done && !e.s.resolved_at && (
        <Link href={`/?quest=${encodeURIComponent(e.s.alert_id)}`} className="mt-1 inline-flex items-center gap-1 font-ui text-xs font-medium underline decoration-graphite/30 underline-offset-4 hover:decoration-graphite">
          {h.viewOnMap} <ArrowRight className="size-3" aria-hidden />
        </Link>
      )}
    </li>
  );
}
