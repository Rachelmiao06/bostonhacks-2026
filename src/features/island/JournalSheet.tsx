"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Patrick_Hand } from "next/font/google";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { QuestKind } from "@/lib/mbta";
import { cn } from "@/lib/utils";
import { categoryInfo, categoryStyle } from "@/features/explore/category";
import { categoryOfKind, kindLabels, type CategoryId } from "@/features/explore/content";
import type { MySubmission, MyVerification, ProgressState } from "@/features/explore/progress";
import { content, unlockSteps } from "./content";
import { demoProgress } from "./demo";
import { glass } from "./glass";
import { Sticker } from "./Sticker";
import { CheckTag, FolderSticker, HeartSticker, StarSticker } from "./Stickers";

// A tidy handwriting face for the planner, loaded only for this sheet.
const hand = Patrick_Hand({ subsets: ["latin"], weight: "400", display: "swap" });

const categoryOf = (s: MySubmission): CategoryId => categoryOfKind[(s.kind ?? "station") as QuestKind] ?? "station";
const kindLabel = (s: MySubmission) => (s.kind ? kindLabels[s.kind as QuestKind] : categoryInfo(categoryOf(s)).label);
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const monthName = (y: number, m: number, style: "long" | "short") => new Date(y, m, 1).toLocaleDateString("en-US", { month: style });
const RINGS = 14;

type Entry =
  | { type: "report"; id: string; at: Date; s: MySubmission }
  | { type: "check"; id: string; at: Date; v: MyVerification };

type Props = {
  progress: ProgressState;
  /** Journey steps on the island now, or null when the rider's progress is not known. */
  known: number | null;
  /** The island preview is on: show an example journal. */
  preview?: boolean;
  onClose: () => void;
  onRetry: () => void;
};

/** One sticker for one thing the rider did. A picture in /assets/island/stickers/ if there is one, else a built-in drawing. */
function EntrySticker({ e, size }: { e: Entry; size: string }) {
  const t = content.sheet;
  if (e.type === "check") {
    const ok = e.v.verdict === "working";
    return <Sticker id={ok ? "check" : "broken"} className={cn("h-7 w-auto", size)} fallback={<CheckTag ok={ok} label={ok ? t.checkTag : t.brokenTag} />} />;
  }
  if (e.s.status === "completed") return <Sticker id="star" className={size} fallback={<StarSticker className={size} />} />;
  return <Sticker id="folder" className={size} fallback={<FolderSticker className={size} />} />;
}

/** What a day shows: its stickers, a little crooked and overlapping like a scrapbook. A liked report adds a heart.
 *  They slap onto the page when the month opens, and lift a little when the day is pointed at. */
function DayStickers({ entries, delay = 0, size = "size-7 sm:size-9" }: { entries: Entry[]; delay?: number; size?: string }) {
  const still = useReducedMotion();
  const items: { key: string; node: React.ReactNode }[] = [];
  for (const e of entries) {
    items.push({ key: e.id, node: <EntrySticker e={e} size={size} /> });
    if (e.type === "report" && (e.s.likes ?? 0) > 0) items.push({ key: `${e.id}-h`, node: <Sticker id="heart" className={size} fallback={<HeartSticker className={size} />} /> });
  }
  const shown = items.slice(0, 3);
  const tilt = ["-rotate-6", "rotate-6", "-rotate-3"];
  return (
    <span className="flex items-center justify-center">
      {shown.map((it, i) => (
        <motion.span
          key={it.key}
          initial={still ? false : { opacity: 0, scale: 1.7, y: -14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 15, delay: delay + i * 0.08 }}
          className={cn("block", i > 0 && "-ml-2.5")}
        >
          <span className={cn("block transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-110 group-hover:drop-shadow-md", tilt[i % tilt.length])}>{it.node}</span>
        </motion.span>
      ))}
      {items.length > shown.length && <span className="ml-0.5 text-[0.65rem] text-cat-access">+{items.length - shown.length}</span>}
    </span>
  );
}

/**
 * The journal as a page from a spiral-bound planner: a month calendar (Monday first) with a sticker on every day the rider did
 * something, and their notes for the tapped day underneath. The arrows and the month tabs go back through the history. Sticker
 * pictures can be dropped into /assets/island/stickers/ (see Sticker.tsx); until then drawn stickers are used.
 * Data is the server's (GET /api/submissions, via useMyProgress): if it cannot be loaded the page says so, it never passes off a
 * failed load as an empty journal. With no history yet (or in the preview) it shows an example journal, clearly labelled.
 */
export function JournalSheet({ progress, known, preview = false, onClose, onRetry }: Props) {
  const t = content.sheet;
  const h = content.history;
  const still = useReducedMotion();
  // A gentle 3D tilt that follows the mouse, so the page feels like an object on a table (not for touch or Reduced Motion).
  const tiltY = useMotionValue(0);
  const tiltX = useMotionValue(0);
  const rotateY = useSpring(tiltY, { stiffness: 110, damping: 18 });
  const rotateX = useSpring(tiltX, { stiffness: 110, damping: 18 });
  const onTilt = (e: React.PointerEvent<HTMLDivElement>) => {
    if (still || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    tiltY.set(((e.clientX - r.left) / r.width - 0.5) * 8);
    tiltX.set(-((e.clientY - r.top) / r.height - 0.5) * 6);
  };
  const today = useMemo(() => new Date(), []);
  const real = progress.status === "ready" ? progress.data : null;
  const isEmpty = real !== null && real.submissions.length === 0 && real.verifications.length === 0;
  // Examples fill the page when there is nothing real to show: an empty journal, the preview, or a history that cannot load
  // (then the error stays visible too, so the examples are never taken for the rider's own).
  const unavailable = progress.status === "unavailable";
  const demo = preview || isEmpty || unavailable;
  const data = demo ? demoProgress(today) : real;

  const entries = useMemo<Entry[]>(() => {
    if (!data) return [];
    return [
      ...data.submissions.map((s): Entry => ({ type: "report", id: `r-${s.id}`, at: new Date(s.completed_at ?? s.updated_at), s })),
      ...data.verifications.map((v): Entry => ({ type: "check", id: `c-${v.alert_id}`, at: new Date(v.created_at), v })),
    ].sort((a, b) => b.at.getTime() - a.at.getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo, real]);
  const byDay = useMemo(() => {
    const m = new Map<string, Entry[]>();
    for (const e of entries) m.set(dayKey(e.at), [...(m.get(dayKey(e.at)) ?? []), e]);
    return m;
  }, [entries]);

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
  const sel = picked ?? (monthEntries[0] ? dayKey(monthEntries[0].at) : null);
  const selEntries = sel ? (byDay.get(sel) ?? []) : [];
  const selDate = selEntries[0]?.at;
  const showCalendar = data !== null && entries.length > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const arrow = "grid size-8 cursor-pointer place-items-center rounded-full text-cat-access outline-none hover:bg-cat-access/10 focus-visible:ring-2 focus-visible:ring-cat-access/40 disabled:pointer-events-none disabled:opacity-30";

  return (
    <div
      role="dialog"
      aria-label={t.label}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onPointerMove={onTilt}
      onPointerLeave={() => {
        tiltX.set(0);
        tiltY.set(0);
      }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-linear-to-b from-ivory/70 via-ivory/55 to-ivory/70 px-5 pt-20 pb-4 font-ui text-graphite backdrop-blur-[5px]"
    >
      {/* The planner unfolds from the top: it starts as a thin folded strip and opens out. */}
      <motion.div
        initial={still ? false : { opacity: 0, scaleY: 0.12, scaleX: 0.86, rotateX: -35 }}
        animate={{ opacity: 1, scaleY: 1, scaleX: 1, rotateX: 0, rotate: -0.3 }}
        transition={{ type: "spring", stiffness: 90, damping: 15, mass: 1.1 }}
        style={{ transformOrigin: "50% 0%", transformPerspective: 1600 }}
        className="relative h-[min(37rem,calc(100svh-12rem))] w-[min(35rem,calc(100vw-2.5rem))]"
      >
        <motion.div style={{ rotateX, rotateY, transformPerspective: 1300 }} className="relative h-full w-full">
        {/* it sits on the table: a soft shadow, the cover board under the page, and a couple of loose sheets peeking out */}
        <span aria-hidden className="absolute inset-x-4 -bottom-4 h-6 rounded-full bg-graphite/25 blur-xl" />
        <span aria-hidden className="absolute inset-0 translate-x-2 translate-y-2.5 rounded-md bg-cat-access/80 shadow-float" />
        <span aria-hidden className="absolute inset-0 translate-x-1 translate-y-1.5 rotate-[0.7deg] rounded-md border border-hairline bg-ivory" />
        <span aria-hidden className="absolute inset-0 translate-x-0.5 translate-y-0.5 -rotate-[0.5deg] rounded-md border border-hairline bg-stone" />

        {/* the spiral binding: metal rings that cast a little shadow on the page */}
        <div aria-hidden className="pointer-events-none absolute inset-y-5 -left-3 z-20 flex flex-col justify-between">
          {Array.from({ length: RINGS }, (_, i) => (
            <span key={i} className="block h-2.5 w-7 rounded-full border-2 border-graphite/55 bg-linear-to-b from-ivory via-stone to-graphite/30 shadow-[2px_3px_3px_var(--shade-soft)]" />
          ))}
        </div>

        <div className="relative flex h-full overflow-hidden rounded-md border border-cat-access/30 bg-ivory bg-[radial-gradient(var(--hairline)_1px,transparent_1px)] bg-[length:14px_14px] shadow-float">
          {/* shaded gutter by the binding, and a curled corner */}
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r from-graphite/15 to-transparent" />
          <span aria-hidden className="pointer-events-none absolute right-0 bottom-0 z-10 size-10 bg-linear-to-tl from-stone via-stone/70 to-transparent [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
          <button
            type="button"
            onClick={onClose}
            aria-label={content.gift.close}
            className="absolute top-2 right-2 z-30 grid size-8 cursor-pointer place-items-center rounded-full bg-ivory/90 text-taupe outline-none hover:bg-stone hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/40"
          >
            <X className="size-4" aria-hidden />
          </button>

          <div className={cn("relative min-w-0 flex-1 overflow-y-auto pt-4 pr-3 pb-5 pl-6 sm:pr-5 sm:pl-8", hand.className)}>
            <header className="relative pr-9">
              <p className="font-pixel text-[0.5rem] tracking-wide text-cat-access uppercase">
                {t.title} · {t.sub}
              </p>
              <h2 className="mt-1 font-serif text-4xl leading-none font-bold tracking-tight text-cat-access sm:text-5xl">{monthName(view.y, view.m, "long")}</h2>
              <p className="font-serif text-lg font-semibold text-cat-access/80">{view.y}</p>
              {known !== null && <p className="text-base leading-tight text-taupe">{content.journey.summary(known, unlockSteps.length)}</p>}
              {/* loose stickers on the page: pictures from /assets/island/stickers/ when there are some */}
              <span aria-hidden className="absolute top-1 right-2 flex items-start">
                <Sticker id="deco-1" className="size-11 rotate-6 sm:size-14" fallback={<HeartSticker className="size-9 rotate-6 sm:size-11" />} />
                <Sticker id="deco-2" className="-ml-2 size-9 -rotate-12 sm:size-11" fallback={<StarSticker className="-ml-2 size-7 -rotate-12 sm:size-9" />} />
              </span>
            </header>

            {progress.status === "loading" && !preview && <p className="mt-4 text-xl text-taupe">{h.loading}</p>}
            {unavailable && !preview && (
              <p role="alert" className="mt-4 flex flex-wrap items-center gap-2 text-xl text-taupe">
                {h.unavailable}
                <button type="button" onClick={onRetry} className="cursor-pointer rounded-full bg-graphite px-3 py-0.5 font-ui text-xs font-medium text-ivory outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25">
                  {content.retry}
                </button>
              </p>
            )}
            {demo && showCalendar && (
              <p className="mt-2 inline-block -rotate-1 rounded-sm bg-cat-station/20 px-2 py-0.5 text-base">{preview ? t.examplePreview : unavailable ? t.exampleOffline : t.exampleEmpty}</p>
            )}

            {showCalendar && (
              <>
                {/* month bar */}
                <div className="mt-2 flex items-center justify-between">
                  <button type="button" aria-label={t.prevMonth} disabled={idx <= minIdx} onClick={() => goTo(idx - 1)} className={arrow}>
                    <ChevronLeft className="size-4" aria-hidden />
                  </button>
                  <p className="text-base text-taupe" aria-live="polite">
                    {t.summary(reportsN, checksN)}
                  </p>
                  <button type="button" aria-label={t.nextMonth} disabled={idx >= maxIdx} onClick={() => goTo(idx + 1)} className={arrow}>
                    <ChevronRight className="size-4" aria-hidden />
                  </button>
                </div>

                <div className="flex gap-2">
                  {/* the month, in a blue-ruled frame with tape on its corners */}
                  <div className="relative min-w-0 flex-1 rounded-sm border-2 border-cat-access/60">
                    <span aria-hidden className="absolute -top-3.5 left-4 z-10 h-4 w-14 -rotate-6 bg-cat-station/40 [clip-path:polygon(0_0,100%_0,97%_25%,100%_50%,97%_75%,100%_100%,0_100%,3%_75%,0_50%,3%_25%)]" />
                    <span aria-hidden className="absolute -top-3.5 right-6 z-10 h-4 w-12 rotate-3 bg-cat-access/30 [clip-path:polygon(0_0,100%_0,97%_25%,100%_50%,97%_75%,100%_100%,0_100%,3%_75%,0_50%,3%_25%)]" />
                    <div className="grid grid-cols-7 border-b border-cat-access/40 bg-cat-access/5 text-center font-pixel text-[0.4rem] tracking-wide text-cat-access uppercase">
                      {t.weekdays.map((d) => (
                        <span key={d} className="py-1.5">
                          {d}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7">
                      {Array.from({ length: lead }, (_, i) => (
                        <span key={`b${i}`} aria-hidden className="h-12 border-r border-b border-cat-access/20 sm:h-16" />
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
                              "group relative flex h-12 items-center justify-center border-r border-b border-cat-access/20 p-0.5 outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-cat-access/50 sm:h-16",
                              list.length > 0 ? "cursor-pointer hover:bg-cat-access/5" : "cursor-default",
                              isSel && "bg-cat-station/15",
                            )}
                          >
                            <span className={cn("absolute top-0.5 left-1 text-[0.68rem] leading-none text-cat-access", isToday && "rounded-full bg-cat-access px-1 py-0.5 text-ivory")}>{i + 1}</span>
                            <span className="mt-2 block">
                              <DayStickers key={`${view.y}-${view.m}-${i}`} entries={list} delay={0.25 + i * 0.025} />
                            </span>
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
                          className={cn("cursor-pointer font-pixel text-[0.4rem] tracking-wide uppercase outline-none [writing-mode:vertical-rl] focus-visible:ring-2 focus-visible:ring-cat-access/50 disabled:cursor-default", on ? "border-r-2 border-cat-access text-cat-access" : "text-taupe/70 hover:text-cat-access disabled:opacity-40")}
                        >
                          {monthName(view.y, m, "short")}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* the notes for the day you tapped, taped onto the page */}
                <section className="mt-5" aria-live="polite">
                  <h3 className="flex items-center gap-2 text-2xl leading-tight">
                    <span className="rounded-sm bg-cat-station/20 px-1.5">{selDate ? selDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : t.notes}</span>
                    {demo && <span className="rotate-2 rounded-sm border border-dashed border-graphite/40 px-1.5 text-sm text-taupe">{t.exampleTag}</span>}
                  </h3>
                  {selDate ? (
                    <ul className="mt-3 space-y-5">
                      {selEntries.map((e, i) => (
                        <EntryNote key={e.id} e={e} demo={demo} tilt={i % 2 === 0 ? "-rotate-1" : "rotate-1"} />
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xl text-taupe">{t.nothingMonth}</p>
                  )}
                  {selDate && !picked && monthEntries.length > selEntries.length && <p className="mt-3 text-base text-taupe">{t.pickDay}</p>}
                </section>
                <p className="mt-4 font-ui text-[0.68rem] text-taupe">{h.honest}</p>
              </>
            )}
          </div>
        </div>
        </motion.div>
      </motion.div>

      <button data-autofocus type="button" onClick={onClose} className={`inline-flex h-9 cursor-pointer items-center rounded-full px-4 font-ui text-xs font-medium outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25 ${glass}`}>
        <span className="relative">{content.gift.back}</span>
      </button>
    </div>
  );
}

/** One thing that happened on the selected day, written on a little note taped to the page. */
function EntryNote({ e, demo, tilt }: { e: Entry; demo: boolean; tilt: string }) {
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
    <li className={cn("relative rounded-sm border border-hairline bg-ivory px-3 pt-4 pb-3 shadow-float transition-transform duration-200 hover:-translate-y-0.5 hover:rotate-0", tilt)}>
      <span aria-hidden className="absolute -top-2.5 left-1/2 h-4 w-16 -translate-x-1/2 rotate-2 bg-cat-station/30" />
      <p className="text-xl leading-tight">
        <span className={cn("mr-1.5 rounded-sm px-1.5 text-base", style.soft, style.text)}>{isReport ? kindLabel(e.s) : h.checks}</span>
        {isReport ? t.reportAt(station) : t.checkedFix(station)}
      </p>
      {(isReport ? e.s.header : e.v.header) && <p className="font-ui text-xs text-graphite/70">{isReport ? e.s.header : e.v.header}</p>}
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
      {!demo && isReport && !done && !e.s.resolved_at && (
        <Link href={`/?quest=${encodeURIComponent(e.s.alert_id)}`} className="mt-1 inline-flex items-center gap-1 font-ui text-xs font-medium underline decoration-graphite/30 underline-offset-4 hover:decoration-graphite">
          {h.viewOnMap} <ArrowRight className="size-3" aria-hidden />
        </Link>
      )}
    </li>
  );
}
