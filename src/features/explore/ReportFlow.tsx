"use client";

import { useEffect, useRef } from "react";
import { Camera, ChevronDown, ImagePlus, Plus, Sparkles, TriangleAlert, X } from "lucide-react";
import type { Quest } from "@/lib/mbta";
import type { Review } from "@/lib/ai";
import { content as challengeText, flow, settings } from "@/features/challenge/content";
import { useReport, type ReportStep } from "@/features/challenge/useReport";
import { cn } from "@/lib/utils";
import { categoryOf, categoryStyle } from "./category";
import { Celebration } from "./Celebration";
import { refreshProgress } from "./progress";
import { AtlasButton, AtlasTextarea, ErrorNote } from "./ui";

/**
 * A report quest inside the map panel. Every rule (AI check, "not checked" after an edit,
 * Complete only after a passing check on the unchanged report, draft never lost) lives in
 * PR #14's useReport hook; this file only draws it in the atlas style.
 */
export function ReportFlow({ quest, onDone }: { quest: Quest; onDone: () => void }) {
  const r = useReport(quest);
  const photoIO = usePhotoInputs(r.pickPhoto); // before any early return: hooks keep their order
  const textRef = useRef<HTMLTextAreaElement>(null);
  const style = categoryStyle[categoryOf(quest)];

  // A fresh completion changes stamps and tokens: reload them for the pins and the chip.
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
        extra={r.done.text && <blockquote className="border-l-2 border-graphite/20 pl-3 font-serif text-[0.95rem] text-graphite/85 italic">“{r.done.text}”</blockquote>}
      />
    );
  }

  function addStarter(starter: string) {
    const joiner = r.text.trim() ? (r.text.endsWith(" ") || r.text.endsWith("\n") ? "" : " ") : "";
    const next = r.text.trimEnd() === r.text ? r.text + joiner + starter : r.text + starter;
    r.setText(next);
    requestAnimationFrame(() => {
      const el = textRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(next.length, next.length);
    });
  }

  const hint = !r.hasContent ? flow.hintEmpty : r.canComplete ? null : r.review?.isCurrent ? flow.hintNeedsPass : flow.hintNeedsCheck;

  // Show only the next step: nothing until there is something to check, then Check, then Complete.
  const primary = r.canComplete ? "complete" : r.hasContent ? "check" : null;
  // The question starters help the first sentence; once the rider is writing they step aside.
  const showStarters = r.text.trim().length < 60;
  const showCount = r.tooLong || r.text.length > 1800;

  return (
    <div className="space-y-4 font-ui">
      {/* Progress is the bar alone. The step names and the help sentence are read out to screen readers. */}
      <Stepper step={r.step} activeBg={style.bg} />
      <p aria-live="polite" className="sr-only">
        {flow.stepHelp[r.step as 0 | 1 | 2 | 3]} {hint}
      </p>

      {showStarters && (
        <div className="flex flex-wrap gap-1.5">
          {flow.prompts.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => addStarter(p.starter)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-graphite/15 bg-ivory px-2.5 py-1 text-xs text-taupe outline-none hover:border-graphite/30 hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/25"
            >
              <Plus className="size-3" aria-hidden /> {p.label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="map-report-text" className="sr-only">
          {flow.textLabel}
        </label>
        <AtlasTextarea
          ref={textRef}
          id="map-report-text"
          value={r.text}
          onChange={(e) => r.setText(e.target.value)}
          placeholder={flow.prompts[2].label}
          rows={4}
          aria-invalid={r.tooLong || undefined}
          className="min-h-28"
        />
        {showCount && (
          <p className={cn("text-right text-xs text-taupe tabular-nums", r.tooLong && "font-semibold text-cat-service")}>{flow.charCount(r.text.length)}</p>
        )}
      </div>

      {photoIO.inputs}
      {r.photo && <PhotoChip photo={r.photo} onReplace={photoIO.openLibrary} onRemove={r.removePhoto} />}
      {r.photo && <p className="text-[0.7rem] text-taupe">{flow.photoNote}</p>}
      {r.photoError && <ErrorNote>{r.photoError}</ErrorNote>}

      {/* One row: photo icons on the left, the one next action on the right */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {!r.photo && (
            <>
              <AtlasButton tone="outline" className="h-10 w-10 px-0" aria-label={challengeText.takePhoto} onClick={photoIO.openCamera}>
                <Camera className="size-4" aria-hidden />
              </AtlasButton>
              <AtlasButton tone="outline" className="h-10 w-10 px-0" aria-label={challengeText.addPhoto} onClick={photoIO.openLibrary}>
                <ImagePlus className="size-4" aria-hidden />
              </AtlasButton>
            </>
          )}
        </div>
        {primary === "check" && (
          <AtlasButton size="lg" disabled={!r.canCheck} onClick={r.check}>
            <Sparkles className="size-4" aria-hidden /> {r.checking ? flow.checking : flow.check}
          </AtlasButton>
        )}
        {primary === "complete" && (
          <AtlasButton size="lg" fill="bg-cat-verify" disabled={!r.canComplete} onClick={r.complete}>
            {r.completing ? flow.completing : flow.complete}
          </AtlasButton>
        )}
      </div>

      {r.error && <ErrorNote>{r.error}</ErrorNote>}
      {r.review && <ReviewNote review={r.review.result} isCurrent={r.review.isCurrent} />}
    </div>
  );
}

/** The four-step progress bar. Bars only; the step names are for screen readers. */
function Stepper({ step, activeBg }: { step: ReportStep; activeBg: string }) {
  return (
    <ol aria-label={flow.stepsLabel} className="grid grid-cols-4 gap-1.5">
      {flow.steps.map((label, i) => {
        const state = i < step ? "done" : i === step ? "current" : "todo";
        return (
          <li key={label} aria-current={state === "current" ? "step" : undefined}>
            <span aria-hidden className={cn("block h-1.5 rounded-full", state === "done" ? "bg-graphite" : state === "current" ? activeBg : "bg-stone-deep")} />
            <span className="sr-only">
              {label}
              {state === "done" && " (done)"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

type PhotoProps = {
  photo: { previewUrl: string; file: File } | null;
  error: string | null;
  onPick: (file: File, options?: { fromCamera?: boolean }) => void;
  onRemove: () => void;
};

/** The two hidden file inputs (library, camera). Shrinking and checks happen in useReport. */
function usePhotoInputs(onPick: PhotoProps["onPick"]) {
  const libraryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const accept = settings.acceptedPhotoTypes.join(",");
  const change = (fromCamera: boolean) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onPick(file, { fromCamera });
    e.target.value = "";
  };
  return {
    inputs: (
      <>
        <input ref={libraryRef} type="file" accept={accept} className="sr-only" tabIndex={-1} aria-label={challengeText.addPhoto} onChange={change(false)} />
        <input ref={cameraRef} type="file" accept={accept} capture="environment" className="sr-only" tabIndex={-1} aria-label={challengeText.takePhoto} onChange={change(true)} />
      </>
    ),
    openLibrary: () => libraryRef.current?.click(),
    openCamera: () => cameraRef.current?.click(),
  };
}

/** The chosen photo: a small preview with two icons (change it, remove it). */
function PhotoChip({ photo, onReplace, onRemove }: { photo: NonNullable<PhotoProps["photo"]>; onReplace: () => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-hairline bg-stone p-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- local preview from the rider's device */}
      <img src={photo.previewUrl} alt="Your photo" className="size-12 rounded-lg object-cover" />
      <span className="min-w-0 flex-1 truncate text-xs text-taupe">{photo.file.name}</span>
      <AtlasButton tone="ghost" className="h-9 w-9 px-0" aria-label={challengeText.replacePhoto} onClick={onReplace}>
        <ImagePlus className="size-4" aria-hidden />
      </AtlasButton>
      <AtlasButton tone="ghost" className="h-9 w-9 px-0" aria-label={challengeText.removePhoto} onClick={onRemove}>
        <X className="size-4" aria-hidden />
      </AtlasButton>
    </div>
  );
}

/** The coach's answer: pass or not, what to fix, and the scores one tap away. */
function ReviewNote({ review, isCurrent }: { review: Review; isCurrent: boolean }) {
  const ok = review.status === "reviewed";
  const scores = Object.entries(flow.scoreNames).flatMap(([key, label]) => {
    const value = review.scores[key as keyof Review["scores"]];
    return value === null ? [] : [{ key, label, value }];
  });

  return (
    <section aria-label={flow.reviewTitle} className="space-y-3 rounded-xl border border-hairline bg-stone p-4">
      <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-ivory", ok ? "bg-cat-verify" : "bg-cat-station")}>
        {ok ? flow.passed : flow.needsRevision}
      </span>

      {!isCurrent && (
        <p role="status" className="flex items-start gap-2 rounded-lg bg-cat-station/10 px-3 py-2 text-xs font-medium text-cat-station">
          <TriangleAlert aria-hidden className="mt-px size-3.5 shrink-0" /> {flow.notChecked}
        </p>
      )}

      <div className={cn("space-y-3", !isCurrent && "opacity-55")}>
        <p className="text-sm leading-relaxed">{review.feedback}</p>
        {review.suggestions.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {review.suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}

        {/* Scores: a row of small bars; tap for the names and numbers */}
        <details className="group">
          <summary
            aria-label={flow.scoreNames.relevance + " / " + flow.scoreNames.specificity + " / " + flow.scoreNames.completeness}
            className="flex cursor-pointer list-none items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-graphite/40 [&::-webkit-details-marker]:hidden"
          >
            <span aria-hidden className="flex gap-1">
              {scores.map((sc) => (
                <span key={sc.key} className={cn("h-1.5 w-6 rounded-full", sc.value >= 3 ? "bg-cat-verify" : "bg-cat-station")} />
              ))}
            </span>
            <ChevronDown className="size-3.5 text-taupe transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <dl className="mt-2.5 grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
            {scores.map((sc) => (
              <div key={sc.key} className="space-y-1">
                <dt className="flex justify-between text-xs">
                  <span className="font-medium">{sc.label}</span>
                  <span className="text-taupe tabular-nums">{sc.value} / 5</span>
                </dt>
                <dd aria-hidden className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className={cn("h-1.5 flex-1 rounded-full", n <= sc.value ? (sc.value >= 3 ? "bg-cat-verify" : "bg-cat-station") : "bg-stone-deep")} />
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      </div>
      <p className="text-[0.7rem] text-taupe">{flow.aiDisclaimer}</p>
    </section>
  );
}
