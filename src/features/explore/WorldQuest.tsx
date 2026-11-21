"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ChevronLeft, ChevronRight, ExternalLink, TriangleAlert, X } from "lucide-react";
import type { Review } from "@/lib/ai";
import type { Quest } from "@/lib/mbta";
import { flow } from "@/features/challenge/content";
import { useReport } from "@/features/challenge/useReport";
import { cn } from "@/lib/utils";
import { categoryInfo, categoryOf, categoryStyle } from "./category";
import { Celebration } from "./Celebration";
import { content, kindLabels, world } from "./content";
import { firstGlow, TicketHint, useFirstTicket } from "./Hints";
import { refreshProgress } from "./progress";
import { AtlasButton, AtlasTextarea, ErrorNote, Eyebrow } from "./ui";
import { VerifyFlow } from "./VerifyFlow";
import { prefersReducedMotion } from "./world";

type Props = {
  quests: Quest[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
  /** Opens the full side panel (adds a photo). */
  onFullForm: (quest: Quest) => void;
};

/**
 * The question, asked inside the little world. A problem on the map talks to you in a speech bubble
 * and you answer by typing right there: no form to find, no page to open.
 * The rules (AI check, stamp only after a passing check on the unchanged answer) are PR #14's useReport.
 */
export function WorldQuest({ quests, index, onIndex, onClose, onFullForm }: Props) {
  const quest = quests[Math.min(index, quests.length - 1)];
  const root = useRef<HTMLElement>(null);
  // First ticket ever? Decided once when the bubble opens (a hook, so it sits above the early return).
  const firstTicket = useFirstTicket();

  // Slides up from the bottom of the screen.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    // fromTo (not from) so React's double-run of effects in development cannot leave it half-hidden.
    const tween = gsap.fromTo(
      root.current,
      { y: 48, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", clearProps: "transform,opacity" },
    );
    return () => {
      tween.kill();
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!quest) return null;
  const category = categoryOf(quest);
  const style = categoryStyle[category];
  const Icon = style.icon;
  const verify = quest.mode === "verify";
  const ask = verify ? world.askVerify : world.asks[quest.kind];

  return (
    <section
      ref={root}
      aria-label={quest.stationName}
      className="fixed inset-x-2 bottom-2 z-[45] flex max-h-[72dvh] flex-col overflow-hidden rounded-2xl border border-hairline bg-ivory font-ui text-graphite shadow-ticket sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:w-[min(40rem,calc(100vw-2rem))] sm:-translate-x-1/2"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-hairline px-3 py-2">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold", style.soft, style.text)}>
          <Icon className="size-3.5" aria-hidden />
          <span className="max-sm:sr-only">{verify ? categoryInfo("verify").label : kindLabels[quest.kind]}</span>
        </span>
        <h3 className="min-w-0 flex-1 truncate font-serif text-base font-semibold">{quest.stationName}</h3>
        {quests.length > 1 && (
          <div className="flex items-center gap-0.5 text-xs text-taupe">
            <button
              type="button"
              aria-label={content.ticket.prev}
              disabled={index === 0}
              onClick={() => onIndex(index - 1)}
              className="grid size-7 cursor-pointer place-items-center rounded-full outline-none hover:bg-stone-deep/60 focus-visible:ring-2 focus-visible:ring-graphite/25 disabled:opacity-30"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <span className="tabular-nums">{content.ticket.number(index + 1, quests.length)}</span>
            <button
              type="button"
              aria-label={content.ticket.next}
              disabled={index >= quests.length - 1}
              onClick={() => onIndex(index + 1)}
              className="grid size-7 cursor-pointer place-items-center rounded-full outline-none hover:bg-stone-deep/60 focus-visible:ring-2 focus-visible:ring-graphite/25 disabled:opacity-30"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        )}
        <button
          type="button"
          aria-label={world.close}
          onClick={onClose}
          className="grid size-8 cursor-pointer place-items-center rounded-full text-taupe outline-none hover:bg-stone-deep/60 hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/25"
        >
          <X className="size-4" aria-hidden />
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
        <Bubble key={`ask-${quest.id}`} text={ask} />
        <p className="line-clamp-2 max-sm:line-clamp-1 font-mono text-[0.62rem] leading-relaxed tracking-wide text-taupe uppercase">
          {content.panel.alert}: {quest.header}
        </p>

        {verify ? (
          <>
            <TicketHint show={firstTicket} />
            <div className={cn("rounded-2xl", firstTicket && firstGlow)}>
              <VerifyFlow key={`verify-${quest.id}`} quest={quest} onDone={onClose} />
            </div>
          </>
        ) : (
          <ReportBody key={`report-${quest.id}`} quest={quest} first={firstTicket} onDone={onClose} onFullForm={() => onFullForm(quest)} />
        )}
      </div>
    </section>
  );
}

/** Reveals text letter by letter with GSAP, like a character speaking. With Reduced Motion it is all there at once. */
function useTypewriter(text: string) {
  const [shown, setShown] = useState(() => (typeof window !== "undefined" && prefersReducedMotion() ? text.length : 0));
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const counter = { n: 0 };
    const tween = gsap.to(counter, {
      n: text.length,
      duration: Math.min(2.4, text.length * 0.02),
      ease: "none",
      onUpdate: () => setShown(Math.floor(counter.n)),
    });
    return () => {
      tween.kill();
    };
  }, [text]);
  return text.slice(0, shown);
}

function Bubble({ text }: { text: string }) {
  const typed = useTypewriter(text);
  return (
    <div className="relative rounded-2xl rounded-bl-sm border border-hairline bg-stone px-4 py-3">
      <Eyebrow className="mb-1">{world.question}</Eyebrow>
      {/* The full sentence is there for screen readers from the start; the typing is only for eyes. */}
      <p className="sr-only">{text}</p>
      <p aria-hidden className="min-h-[3.2em] font-serif text-base leading-snug sm:text-[1.05rem]">
        {typed}
        <span className="ml-0.5 inline-block h-[1em] w-0.5 translate-y-0.5 bg-graphite/60 motion-safe:animate-pulse" />
      </p>
    </div>
  );
}

function ReportBody({ quest, first, onDone, onFullForm }: { quest: Quest; first: boolean; onDone: () => void; onFullForm: () => void }) {
  const r = useReport(quest);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // On wide screens the cursor is already in the box. On phones we leave the keyboard down until asked.
  useEffect(() => {
    if (window.matchMedia("(min-width: 640px)").matches) textRef.current?.focus({ preventScroll: true });
  }, []);

  const justDone = r.done !== null && !r.done.already;
  useEffect(() => {
    if (justDone) void refreshProgress();
  }, [justDone]);

  if (r.done) {
    return (
      <Celebration
        quest={quest}
        tokens={r.done.tokens}
        already={r.done.already}
        handedOff={r.done.handedOff}
        onHandOff={r.handOff}
        onDone={onDone}
        extra={
          r.done.text && (
            <blockquote className="border-l-2 border-graphite/20 pl-3 font-serif text-[0.95rem] text-graphite/85 italic">“{r.done.text}”</blockquote>
          )
        }
      />
    );
  }

  function addStarter(starter: string) {
    const joiner = r.text.trim() && !r.text.endsWith(" ") && !r.text.endsWith("\n") ? " " : "";
    r.setText(r.text + joiner + starter);
    textRef.current?.focus();
  }

  return (
    <div className="space-y-3">
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
        {flow.prompts.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => addStarter(p.starter)}
            className="shrink-0 cursor-pointer rounded-full border border-graphite/15 bg-ivory px-2.5 py-1 text-xs text-taupe outline-none hover:border-graphite/30 hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/25"
          >
            + {p.label}
          </button>
        ))}
      </div>

      <TicketHint show={first} />

      <div className="space-y-1">
        <label htmlFor="world-answer" className="sr-only">
          {flow.textLabel}
        </label>
        <AtlasTextarea
          ref={textRef}
          id="world-answer"
          rows={2}
          value={r.text}
          onChange={(e) => r.setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void r.check();
            }
          }}
          placeholder={world.placeholder}
          aria-invalid={r.tooLong || undefined}
          className={cn("resize-none", first && firstGlow)}
        />
        <p className="flex justify-between gap-2 text-[0.7rem] text-taupe">
          <span className="hidden sm:inline">{world.enterHint}</span>
          <span className={cn("ml-auto tabular-nums", r.tooLong && "font-semibold text-cat-service")}>{flow.charCount(r.text.length)}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AtlasButton disabled={!r.canCheck} onClick={r.check} tone={r.canComplete ? "outline" : "solid"}>
          {r.checking ? flow.checking : world.send}
        </AtlasButton>
        <AtlasButton fill="bg-cat-verify" disabled={!r.canComplete} onClick={r.complete}>
          {r.completing ? flow.completing : world.stamp}
        </AtlasButton>
        <button
          type="button"
          onClick={onFullForm}
          className="ml-auto inline-flex cursor-pointer items-center gap-1 text-xs text-taupe underline decoration-hairline underline-offset-4 outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/25"
        >
          {world.fullForm} <ExternalLink className="size-3" aria-hidden />
        </button>
      </div>

      {r.error && <ErrorNote>{r.error}</ErrorNote>}
      {r.review && <Coach review={r.review.result} isCurrent={r.review.isCurrent} />}
    </div>
  );
}

/** The AI coach answers back as a second speech bubble. */
function Coach({ review, isCurrent }: { review: Review; isCurrent: boolean }) {
  const ok = review.status === "reviewed";
  return (
    <div
      role="status"
      className={cn("space-y-2 rounded-2xl rounded-br-sm border border-hairline bg-stone px-4 py-3 text-sm", !isCurrent && "opacity-60")}
    >
      <div className="flex items-center justify-between gap-2">
        <Eyebrow>{world.coachName}</Eyebrow>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold text-ivory", ok ? "bg-cat-verify" : "bg-cat-station")}>
          {ok ? flow.passed : flow.needsRevision}
        </span>
      </div>
      {!isCurrent && (
        <p className="flex items-start gap-1.5 text-xs font-medium text-cat-station">
          <TriangleAlert aria-hidden className="mt-px size-3.5 shrink-0" /> {world.edited}
        </p>
      )}
      <p className="leading-relaxed">{review.feedback}</p>
      {review.suggestions.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-5 text-[0.85rem] text-taupe">
          {review.suggestions.slice(0, 3).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
