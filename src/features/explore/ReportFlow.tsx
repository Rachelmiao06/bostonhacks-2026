"use client";

import { useEffect, useRef } from "react";
import { Camera, Check, ImagePlus, Plus, TriangleAlert, X } from "lucide-react";
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

  return (
    <div className="space-y-5 font-ui">
      <div className="space-y-2.5">
        <Stepper step={r.step} activeBg={style.bg} />
        <p aria-live="polite" className="text-sm font-medium">
          {flow.stepHelp[r.step as 0 | 1 | 2 | 3]}
        </p>
      </div>

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

      <div className="space-y-1.5">
        <label htmlFor="map-report-text" className="font-serif text-lg font-semibold">
          {flow.textLabel}
        </label>
        <AtlasTextarea
          ref={textRef}
          id="map-report-text"
          value={r.text}
          onChange={(e) => r.setText(e.target.value)}
          placeholder={flow.textPlaceholder}
          rows={5}
          aria-invalid={r.tooLong || undefined}
          className="min-h-32"
        />
        <div className="flex justify-between gap-2 text-xs text-taupe">
          <span>{r.text ? flow.draftSaved : ""}</span>
          <span className={cn("tabular-nums", r.tooLong && "font-semibold text-cat-service")}>{flow.charCount(r.text.length)}</span>
        </div>
      </div>

      <PhotoPicker photo={r.photo} error={r.photoError} onPick={r.pickPhoto} onRemove={r.removePhoto} />

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <AtlasButton size="lg" disabled={!r.canCheck} onClick={r.check}>
            {r.checking ? flow.checking : flow.check}
          </AtlasButton>
          <AtlasButton size="lg" fill="bg-cat-verify" disabled={!r.canComplete} onClick={r.complete}>
            {r.completing ? flow.completing : flow.complete}
          </AtlasButton>
        </div>
        {hint && <p className="text-xs text-taupe">{hint}</p>}
      </div>

      {r.error && <ErrorNote>{r.error}</ErrorNote>}
      {r.review && <ReviewNote review={r.review.result} isCurrent={r.review.isCurrent} />}
    </div>
  );
}

function Stepper({ step, activeBg }: { step: ReportStep; activeBg: string }) {
  return (
    <ol aria-label={flow.stepsLabel} className="grid grid-cols-4 gap-1.5">
      {flow.steps.map((label, i) => {
        const state = i < step ? "done" : i === step ? "current" : "todo";
        return (
          <li key={label} aria-current={state === "current" ? "step" : undefined} className="space-y-1">
            <span className={cn("block h-1 rounded-full", state === "done" ? "bg-graphite" : state === "current" ? activeBg : "bg-stone-deep")} />
            <span className={cn("block text-[0.68rem] leading-tight", state === "current" ? "font-semibold text-graphite" : "text-taupe")}>
              {state === "done" && <Check aria-hidden className="mr-0.5 inline size-3" />}
              {label}
              {state === "done" && <span className="sr-only"> (done)</span>}
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

/** One optional photo: from the library, or the camera on phones. Shrinking and checks happen in useReport. */
function PhotoPicker({ photo, error, onPick, onRemove }: PhotoProps) {
  const libraryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const accept = settings.acceptedPhotoTypes.join(",");
  const take = (fromCamera: boolean) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onPick(file, { fromCamera });
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <input ref={libraryRef} type="file" accept={accept} className="sr-only" tabIndex={-1} aria-label={challengeText.addPhoto} onChange={take(false)} />
      <input ref={cameraRef} type="file" accept={accept} capture="environment" className="sr-only" tabIndex={-1} aria-label={challengeText.takePhoto} onChange={take(true)} />
      {photo ? (
        <div className="flex items-center gap-3 rounded-xl border border-hairline bg-stone p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview from the rider's device */}
          <img src={photo.previewUrl} alt="Your photo" className="size-14 rounded-lg object-cover" />
          <span className="min-w-0 flex-1 truncate text-xs text-taupe">{photo.file.name}</span>
          <AtlasButton tone="ghost" size="sm" onClick={() => libraryRef.current?.click()}>
            {challengeText.replacePhoto}
          </AtlasButton>
          <AtlasButton tone="ghost" size="sm" aria-label={challengeText.removePhoto} onClick={onRemove}>
            <X className="size-3.5" />
          </AtlasButton>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <AtlasButton tone="outline" size="sm" onClick={() => libraryRef.current?.click()}>
            <ImagePlus className="size-3.5" aria-hidden /> {challengeText.addPhoto}
          </AtlasButton>
          <AtlasButton tone="outline" size="sm" onClick={() => cameraRef.current?.click()}>
            <Camera className="size-3.5" aria-hidden /> {challengeText.takePhoto}
          </AtlasButton>
        </div>
      )}
      <p className="text-xs text-taupe">{flow.photoNote}</p>
      {error && <ErrorNote>{error}</ErrorNote>}
    </div>
  );
}

function ReviewNote({ review, isCurrent }: { review: Review; isCurrent: boolean }) {
  const ok = review.status === "reviewed";
  const scores = Object.entries(flow.scoreNames).flatMap(([key, label]) => {
    const value = review.scores[key as keyof Review["scores"]];
    return value === null ? [] : [{ key, label, value }];
  });

  return (
    <section aria-label={flow.reviewTitle} className="space-y-3.5 rounded-xl border border-hairline bg-stone p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-serif text-lg font-semibold">{flow.reviewTitle}</h3>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold text-ivory", ok ? "bg-cat-verify" : "bg-cat-station")}>
          {ok ? flow.passed : flow.needsRevision}
        </span>
      </div>

      {!isCurrent && (
        <p role="status" className="flex items-start gap-2 rounded-lg bg-cat-station/10 px-3 py-2 text-xs font-medium text-cat-station">
          <TriangleAlert aria-hidden className="mt-px size-3.5 shrink-0" /> {flow.notChecked}
        </p>
      )}

      <div className={cn("space-y-3.5", !isCurrent && "opacity-55")}>
        <dl className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
          {scores.map((s) => (
            <div key={s.key} className="space-y-1">
              <dt className="flex justify-between text-xs">
                <span className="font-medium">{s.label}</span>
                <span className="text-taupe tabular-nums">{s.value} / 5</span>
              </dt>
              <dd aria-hidden className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={cn("h-1.5 flex-1 rounded-full", n <= s.value ? (s.value >= 3 ? "bg-cat-verify" : "bg-cat-station") : "bg-stone-deep")} />
                ))}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-sm leading-relaxed">{review.feedback}</p>
        {review.suggestions.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-xs font-semibold tracking-wide text-taupe uppercase">{flow.suggestionsTitle}</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {review.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <p className="text-[0.7rem] text-taupe">{flow.aiDisclaimer}</p>
    </section>
  );
}
