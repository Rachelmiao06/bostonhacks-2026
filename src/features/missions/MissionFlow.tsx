"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { useReducedMotion } from "motion/react";
import { ArrowLeft, ExternalLink, Loader2, MapPin, Sparkles, TriangleAlert, X } from "lucide-react";
import type { Quest } from "@/lib/mbta";
import { stampCount, useMyProgress } from "@/features/explore/progress";
import { cn } from "@/lib/utils";
import { EARLIER_LABELS, partsOf, type Answers } from "./compose";
import { text } from "./content";
import { NudgeTrack, WorldPreview } from "./Collectibles";
import { Choice, PhotoField, Primary, primaryClass, primaryStyle, Secondary, SummaryCard } from "./Parts";
import { PixelIcon } from "./PixelIcon";
import { locationOf } from "./templates";
import { FORM_STEPS, useMission, type Step } from "./useMission";

// The mission's little world behind the card. Loaded only when a mission opens (it brings GSAP and its pictures).
const MissionWorld = dynamic(() => import("@/features/challenge-diorama/MissionWorld"), { ssr: false });

const PREVIOUS: Record<Step, Step | null> = { overview: null, when: "overview", status: "when", note: "status", review: "note", done: null };
const thingOf = (quest: Quest) => (quest.kind === "elevator" || quest.kind === "escalator" ? `the ${quest.kind}` : "it");

/**
 * The whole mission, one screen at a time: overview, three short steps, a review of the update, and the finish.
 * Each screen has one purpose and one main button. Back never loses an answer.
 */
export function MissionFlow({ quest, onClose }: { quest: Quest; onClose: () => void }) {
  const m = useMission(quest);
  const progress = useMyProgress();
  const stampsBefore = progress.status === "ready" ? stampCount(progress.data) : null;
  const body = useRef<HTMLDivElement>(null);
  const stepIndex = FORM_STEPS.indexOf(m.step);
  const previous = PREVIOUS[m.step];

  // The world behind the card. It only draws the rider's answers and the server's result.
  const reduced = useReducedMotion() ?? false;
  const card = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState(300);
  useEffect(() => {
    const el = card.current;
    if (!el) return;
    const watch = new ResizeObserver(() => setCardHeight(el.offsetHeight + 12));
    watch.observe(el);
    return () => watch.disconnect();
  }, []);
  const tone = m.template.options.find((o) => o.id === m.answers.status)?.tone ?? null;

  // A new screen starts at the top, and a screen reader hears its heading first.
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
    body.current?.querySelector<HTMLElement>("[data-mission-heading]")?.focus({ preventScroll: true });
  }, [m.step]);

  return (
    <>
      <MissionWorld
        kind={quest.kind}
        step={m.step}
        when={m.answers.when}
        tone={tone}
        hasNote={m.answers.note.trim().length > 0}
        saving={m.sharing}
        failed={m.shareError !== null}
        confirmed={m.done !== null}
        reduced={reduced}
        bottomInset={cardHeight}
      />
      <div
        ref={card}
        className="flex max-h-[58dvh] min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-ivory/80 bg-ivory/60 text-graphite shadow-ticket backdrop-blur-2xl backdrop-saturate-150 sm:h-full sm:max-h-none"
      >
      <div className="flex shrink-0 items-center justify-between gap-2 px-2 pt-2 font-ui">
        {previous ? (
          <IconButton label={text.back} onClick={() => m.go(previous)}>
            <ArrowLeft className="size-5" aria-hidden />
          </IconButton>
        ) : (
          <span className="size-11" />
        )}
        {stepIndex >= 0 && (
          <div className="min-w-0 flex-1 px-2">
            <div role="progressbar" aria-label={text.steps} aria-valuemin={1} aria-valuemax={3} aria-valuenow={stepIndex + 1} aria-valuetext={text.stepOf(stepIndex + 1, 3)} className="sr-only">
              {FORM_STEPS.map((s, i) => (
                <span key={s} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= stepIndex ? "bg-cat-verify" : "bg-graphite/12")} />
              ))}
            </div>
            <p className="text-center text-sm font-medium text-taupe" aria-hidden>{text.stepOf(stepIndex + 1, 3)}</p>
          </div>
        )}
        <Dialog.Close
          aria-label={text.close}
          className="grid size-11 cursor-pointer place-items-center rounded-full text-taupe outline-none hover:bg-stone-deep/60 hover:text-graphite focus-visible:ring-4 focus-visible:ring-graphite/25"
        >
          <X className="size-5" aria-hidden />
        </Dialog.Close>
      </div>

      <div ref={body} className="flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-4 font-ui">
        {m.step === "overview" && <Overview quest={quest} template={m.template} />}
        {m.step === "when" && <WhenStep quest={quest} answers={m.answers} set={m.setAnswers} />}
        {m.step === "status" && <StatusStep m={m} />}
        {m.step === "note" && <NoteStep m={m} />}
        {m.step === "review" && <ReviewStep m={m} />}
        {m.step === "done" && m.done && <DoneStep m={m} stampsBefore={m.done.stampsBefore} />}
      </div>

      <footer className="shrink-0 space-y-2 border-t border-graphite/10 bg-ivory/60 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
        {m.step === "overview" && (
          <>
            <Primary onClick={() => m.go("when")}>{text.start} <span aria-hidden>→</span></Primary>
            <a href={quest.sourceUrl} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center gap-1.5 rounded-full text-[0.95rem] font-semibold text-graphite underline decoration-graphite/30 underline-offset-4 outline-none hover:decoration-graphite focus-visible:ring-4 focus-visible:ring-graphite/25">
              {text.officialAlert} <ExternalLink className="size-4" aria-hidden />
            </a>
          </>
        )}
        {m.step === "when" &&
          (m.answers.when === "not_yet" ? (
            <Primary onClick={onClose}>{text.backToMap}</Primary>
          ) : (
            <Primary disabled={!m.canNextWhen} onClick={() => m.go("status")}>Next <span aria-hidden>→</span></Primary>
          ))}
        {m.step === "status" && <Primary disabled={!m.canNextStatus} onClick={() => m.go("note")}>Next <span aria-hidden>→</span></Primary>}
        {m.step === "note" && <Primary onClick={() => void m.runReview()}>{text.review} <span aria-hidden>→</span></Primary>}
        {m.step === "review" && <ReviewActions m={m} onClose={onClose} stampsBefore={stampsBefore} />}
        {m.step === "done" && (
          <>
            <Link href="/world" style={primaryStyle} className={cn(primaryClass, "h-12 w-full px-5 text-base")}>
              {text.exploreWorld} <span aria-hidden>→</span>
            </Link>
            <Secondary onClick={onClose}>{text.another}</Secondary>
          </>
        )}
      </footer>
      </div>
    </>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="grid size-11 cursor-pointer place-items-center rounded-full text-taupe outline-none hover:bg-stone-deep/60 hover:text-graphite focus-visible:ring-4 focus-visible:ring-graphite/25">
      {children}
    </button>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <Dialog.Title data-mission-heading tabIndex={-1} className="font-serif text-[1.65rem] leading-tight font-semibold tracking-tight text-graphite outline-none">
      {children}
    </Dialog.Title>
  );
}

function Overview({ quest, template }: { quest: Quest; template: ReturnType<typeof useMission>["template"] }) {
  const where = locationOf(quest);
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid size-14 place-items-center rounded-2xl border border-ivory/90 bg-ivory/80 text-cat-verify shadow-float">
          <PixelIcon name={template.icon} className="size-8" />
        </span>
        <p className="inline-flex items-center rounded-full bg-cat-verify/12 px-3 py-1 text-sm font-semibold text-cat-verify">{template.chip}</p>
      </div>
      <div className="space-y-2">
        <Heading>{template.title}</Heading>
        <p className="text-base leading-relaxed text-graphite/85">{template.description}</p>
      </div>
      <div className="flex gap-3 rounded-2xl border border-graphite/12 bg-ivory/70 p-4">
        <MapPin className="mt-0.5 size-5 shrink-0 text-cat-verify" aria-hidden />
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-taupe uppercase">{text.whereToCheck}</p>
          <p className="mt-0.5 text-base font-semibold text-graphite">{where.primary}</p>
          {where.secondary && <p className="text-sm text-taupe">{where.secondary}</p>}
        </div>
      </div>
      <p className="text-base text-graphite">
        <span className="font-semibold">{text.task}: </span>
        {template.task}
      </p>
      <p className="text-sm leading-snug text-taupe">{text.notOfficial}</p>
    </div>
  );
}

function WhenStep({ quest, answers, set }: { quest: Quest; answers: Answers; set: (patch: Partial<Answers>) => void }) {
  return (
    <div className="space-y-5">
      <Heading>{text.whenTitle(thingOf(quest))}</Heading>
      <fieldset className="space-y-2.5">
        <legend className="sr-only">{text.whenTitle(thingOf(quest))}</legend>
        <Choice name="when" value="now" checked={answers.when === "now"} onChange={() => set({ when: "now", observedAt: answers.observedAt ?? new Date().toISOString(), earlier: null })} label={text.whenNow.label} hint={text.whenNow.hint} icon="spark" />
        <Choice name="when" value="earlier" checked={answers.when === "earlier"} onChange={() => set({ when: "earlier", observedAt: null })} label={text.whenEarlier.label} hint={text.whenEarlier.hint} icon="train" />
        {answers.when === "earlier" && (
          <fieldset className="ml-2 space-y-2 rounded-2xl border border-graphite/12 bg-ivory/50 p-3.5">
            <legend className="px-1 text-sm font-semibold text-graphite">{text.earlierAsk}</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(EARLIER_LABELS) as NonNullable<Answers["earlier"]>[]).map((id) => (
                <label key={id} className={cn("cursor-pointer rounded-full border px-4 py-2.5 text-[0.95rem] font-medium focus-within:ring-4 focus-within:ring-graphite/25", answers.earlier === id ? "border-cat-verify/70 bg-cat-verify/12 text-graphite" : "border-graphite/15 bg-ivory/70 text-graphite")}>
                  <input type="radio" name="earlier" value={id} checked={answers.earlier === id} onChange={() => set({ earlier: id })} className="sr-only" />
                  {EARLIER_LABELS[id]}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <Choice name="when" value="not_yet" checked={answers.when === "not_yet"} onChange={() => set({ when: "not_yet", observedAt: null, earlier: null })} label={text.whenNot.label} hint={text.whenNot.hint} icon="question" />
      </fieldset>
      {answers.when === "not_yet" && (
        <div role="status" className="space-y-1 rounded-2xl border border-graphite/12 bg-ivory/70 p-4">
          <p className="text-base font-semibold text-graphite">{text.notYetTitle}</p>
          <p className="text-sm leading-relaxed text-taupe">{text.notYetBody}</p>
        </div>
      )}
    </div>
  );
}

type M = ReturnType<typeof useMission>;

function StatusStep({ m }: { m: M }) {
  return (
    <div className="space-y-5">
      <Heading>{m.template.statusQuestion}</Heading>
      <fieldset className="space-y-2.5">
        <legend className="sr-only">{m.template.statusQuestion}</legend>
        {m.template.options.map((o) => (
          <Choice key={o.id} name="status" value={o.id} checked={m.answers.status === o.id} onChange={() => m.setAnswers({ status: o.id })} label={o.label} hint={o.hint} icon={o.icon} />
        ))}
      </fieldset>
    </div>
  );
}

function NoteStep({ m }: { m: M }) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Heading>{text.noteTitle}</Heading>
        <p className="text-sm font-medium text-taupe">{text.noteOptional}</p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="mission-note" className="text-sm font-semibold text-graphite">{text.noteLabel}</label>
        <textarea
          id="mission-note"
          value={m.answers.note}
          maxLength={280}
          rows={3}
          onChange={(e) => m.setAnswers({ note: e.target.value })}
          placeholder={m.template.notePlaceholder}
          className="w-full resize-none rounded-2xl border border-graphite/20 bg-ivory/80 p-3.5 text-base leading-relaxed text-graphite outline-none placeholder:text-taupe/80 focus-visible:border-graphite/50 focus-visible:ring-4 focus-visible:ring-graphite/10"
        />
        <p className="text-right text-xs text-taupe tabular-nums">{m.answers.note.length} / 280</p>
      </div>
      <PhotoField photo={m.photo} error={m.photoError} onPick={m.pickPhoto} onRemove={m.removePhoto} />
      <p className="text-sm text-taupe">{text.photoNotProof}</p>
    </div>
  );
}

function ReviewStep({ m }: { m: M }) {
  const r = m.review;
  return (
    <div className="space-y-4" aria-live="polite">
      <div className="space-y-1.5">
        <Heading>{text.reviewTitle}</Heading>
        <p className="text-base text-taupe">{text.reviewIntro}</p>
      </div>
      {m.summary && <SummaryCard summary={m.summary} />}

      {m.checking && (
        <p role="status" className="flex items-center gap-2 text-base text-taupe">
          <Loader2 className="size-4 animate-spin" aria-hidden /> {text.checking}
        </p>
      )}
      {!m.checking && r?.state === "question" && <FollowUp question={r.question} onSend={(answer) => void m.runReview(answer)} />}
      {!m.checking && r?.state === "stuck" && <Notice>{text.stuck}</Notice>}
      {!m.checking && r?.state === "error" && <Notice>{r.message}</Notice>}
      {!m.checking && r?.state === "nothing_to_save" && <Notice>{text.noVerifyUnsure}</Notice>}
      {m.shareError && <Notice>{m.shareError}</Notice>}
      {r?.state === "ready" && (
        <p className="flex items-start gap-2 text-sm leading-snug text-taupe">
          <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
          {r.aiChecked ? text.aiNote : text.shareWho}
        </p>
      )}
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-2xl border border-graphite/15 bg-ivory/80 p-3.5 text-base leading-snug text-graphite">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-cat-station" aria-hidden /> {children}
    </p>
  );
}

function FollowUp({ question, onSend }: { question: string; onSend: (answer: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <div className="space-y-2.5 rounded-2xl border border-graphite/15 bg-ivory/80 p-4">
      <p className="text-xs font-medium tracking-wide text-taupe uppercase">{text.followUpTitle}</p>
      <label htmlFor="mission-followup" className="block text-base font-semibold text-graphite">{question}</label>
      <textarea
        id="mission-followup"
        ref={ref}
        rows={2}
        maxLength={280}
        aria-label={text.followUpAnswer}
        className="w-full resize-none rounded-xl border border-graphite/20 bg-ivory p-3 text-base text-graphite outline-none focus-visible:ring-4 focus-visible:ring-graphite/10"
      />
      <Primary onClick={() => ref.current?.value.trim() && onSend(ref.current.value.trim())}>{text.followUpSend}</Primary>
    </div>
  );
}

function ReviewActions({ m, onClose, stampsBefore }: { m: M; onClose: () => void; stampsBefore: number | null }) {
  const r = m.review;
  if (m.checking || !r) return <Primary disabled><Loader2 className="size-5 animate-spin" aria-hidden /> {text.checking}</Primary>;
  if (r.state === "ready") {
    return (
      <>
        <Primary disabled={m.sharing} onClick={() => void m.share(stampsBefore)}>{m.sharing ? text.sharing : text.share}</Primary>
        <Secondary onClick={() => m.go("note")}>{text.edit}</Secondary>
      </>
    );
  }
  if (r.state === "error") {
    return (
      <>
        <Primary onClick={() => void m.runReview()}>{text.retry}</Primary>
        <Secondary onClick={() => m.go("note")}>{text.edit}</Secondary>
      </>
    );
  }
  if (r.state === "question") return <Secondary onClick={() => m.go("note")}>{text.edit}</Secondary>;
  return (
    <>
      <Primary onClick={() => m.go("note")}>{text.edit}</Primary>
      <Secondary onClick={onClose}>{text.backToMap}</Secondary>
    </>
  );
}

function DoneStep({ m, stampsBefore }: { m: M; stampsBefore: number | null }) {
  const progress = useMyProgress();
  const already = m.done?.already ?? false;
  const stamps = progress.status === "ready" ? stampCount(progress.data) : null;
  const added = !already && stamps !== null && stampsBefore !== null && stamps > stampsBefore;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid size-14 place-items-center rounded-2xl border border-ivory/90 bg-cat-verify text-ivory shadow-float">
          <PixelIcon name="check" className="size-8" />
        </span>
        <span aria-hidden className="text-sun">
          <PixelIcon name="spark" className="size-5" />
        </span>
      </div>
      <div className="space-y-1.5" role="status">
        <Heading>{already ? text.alreadyTitle : text.doneTitle}</Heading>
        <p className="text-base text-graphite/85">{already ? text.alreadyBody : text.doneBody}</p>
      </div>
      {stamps !== null && <WorldPreview known={stamps} justUnlocked={added} />}
      <div className="space-y-2 rounded-2xl border border-graphite/12 bg-ivory/70 p-4">
        <p className="text-xs font-medium tracking-wide text-taupe uppercase">{text.mission}</p>
        <p className="font-semibold text-graphite">{m.template.title}</p>
        {m.summary && !already ? (
          <p className="text-base leading-snug text-graphite/85">
            {[m.summary.unit ? `${m.summary.place} · ${m.summary.unit}` : m.summary.place, m.summary.status, m.summary.when].join(" · ")}
            {m.summary.note ? ` — “${m.summary.note}”` : ""}
          </p>
        ) : (
          m.done?.text && (
            <p className="text-base leading-snug whitespace-pre-line text-graphite/85">
              {partsOf(m.done.text).join("\n")}
            </p>
          )
        )}
        <p className="flex items-center gap-1.5 border-t border-graphite/10 pt-2 text-sm font-medium text-cat-verify">
          <PixelIcon name="check" className="size-4" /> {text.status}: {m.verify ? text.statusSaved : text.statusShared}
        </p>
      </div>
      <NudgeTrack />
      <p className="text-center text-sm text-taupe">{text.keepGoing}</p>
    </div>
  );
}
