"use client";

import { useRef } from "react";
import { Check, Plus, TriangleAlert } from "lucide-react";
import type { Quest } from "@/lib/mbta";
import type { Review } from "@/lib/ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { flow } from "./content";
import { PhotoField } from "./PhotoField";
import { RewardCard } from "./RewardCard";
import { useReport, type ReportStep } from "./useReport";

// Presentation for report quests. Rules live in useReport.ts.
export function ReportForm({ quest }: { quest: Quest }) {
  const r = useReport(quest);
  const textRef = useRef<HTMLTextAreaElement>(null);

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

  if (r.done) {
    return (
      <div className="space-y-6">
        <RewardCard
          tokens={r.done.tokens}
          already={r.done.already}
          handedOff={r.done.handedOff}
          onHandOff={r.handOff}
          extra={r.done.text && <blockquote className="border-l-4 border-ink pl-3 text-sm italic">{r.done.text}</blockquote>}
        />
      </div>
    );
  }

  const hint = !r.hasContent ? flow.hintEmpty : r.canComplete ? null : r.review?.isCurrent ? flow.hintNeedsPass : flow.hintNeedsCheck;

  return (
    <Card>
      <CardHeader className="gap-4">
        <Stepper step={r.step} />
        <p aria-live="polite" className="font-bold">
          {flow.stepHelp[r.step as 0 | 1 | 2 | 3]}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-bold text-muted-foreground">{flow.promptsTitle}</p>
          <div className="flex flex-wrap gap-2">
            {flow.prompts.map((p) => (
              <Button key={p.label} type="button" variant="outline" size="sm" onClick={() => addStarter(p.starter)}>
                <Plus aria-hidden /> {p.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="report-text" className="font-heading text-lg font-bold">
            {flow.textLabel}
          </label>
          <textarea
            ref={textRef}
            id="report-text"
            value={r.text}
            onChange={(e) => r.setText(e.target.value)}
            placeholder={flow.textPlaceholder}
            rows={6}
            aria-invalid={r.tooLong || undefined}
            className="min-h-40 w-full resize-y rounded-2xl border-2 border-ink bg-card p-4 text-base text-card-foreground shadow-chip outline-none placeholder:text-muted-foreground focus-visible:ring-4 focus-visible:ring-sky/60"
          />
          <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
            <span>{r.text ? flow.draftSaved : ""}</span>
            <span className={cn(r.tooLong && "font-bold text-destructive")}>{flow.charCount(r.text.length)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <PhotoField photo={r.photo} error={r.photoError} disabled={false} onPick={r.pickPhoto} onRemove={r.removePhoto} />
          <p className="text-xs text-muted-foreground">{flow.photoNote}</p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <Button type="button" size="lg" disabled={!r.canCheck} onClick={r.check}>
              {r.checking ? flow.checking : flow.check}
            </Button>
            <Button type="button" size="lg" variant="secondary" disabled={!r.canComplete} onClick={r.complete}>
              {r.completing ? flow.completing : flow.complete}
            </Button>
          </div>
          {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
        </div>

        {r.error && (
          <p role="alert" className="rounded-xl border-2 border-ink bg-cherry px-3 py-2 text-sm font-bold text-paper">
            {r.error}
          </p>
        )}

        {r.review && <ReviewCard review={r.review.result} isCurrent={r.review.isCurrent} />}
      </CardContent>
    </Card>
  );
}

export function Stepper({ step }: { step: ReportStep }) {
  return (
    <ol aria-label={flow.stepsLabel} className="grid grid-cols-4 gap-2">
      {flow.steps.map((label, i) => {
        const state = i < step ? "done" : i === step ? "current" : "todo";
        return (
          <li key={label} aria-current={state === "current" ? "step" : undefined} className="space-y-1.5">
            <span
              className={cn(
                "block h-2 rounded-full border-2 border-ink transition-colors",
                state === "done" && "bg-leaf",
                state === "current" && "bg-sun",
                state === "todo" && "bg-muted",
              )}
            />
            <span className={cn("block text-xs leading-tight", state === "current" ? "font-bold" : "text-muted-foreground")}>
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

function ReviewCard({ review, isCurrent }: { review: Review; isCurrent: boolean }) {
  const ok = review.status === "reviewed";
  const scores = Object.entries(flow.scoreNames).flatMap(([key, label]) => {
    const value = review.scores[key as keyof Review["scores"]];
    return value === null ? [] : [{ key, label, value }];
  });

  return (
    <section aria-label={flow.reviewTitle} className="space-y-4 rounded-2xl border-2 border-ink bg-muted p-4 shadow-chip">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-heading text-lg font-bold">{flow.reviewTitle}</h3>
        <span className={cn("rounded-full border-2 border-ink px-3 py-0.5 text-xs font-bold text-ink", ok ? "bg-leaf" : "bg-sun")}>
          {ok ? flow.passed : flow.needsRevision}
        </span>
      </div>

      {!isCurrent && (
        <p role="status" className="flex items-start gap-2 rounded-xl border-2 border-ink bg-sun px-3 py-2 text-sm font-bold text-ink">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" /> {flow.notChecked}
        </p>
      )}

      <div className={cn("space-y-4", !isCurrent && "opacity-60")}>
        <dl className="grid gap-3 sm:grid-cols-2">
          {scores.map((s) => (
            <div key={s.key} className="space-y-1">
              <dt className="flex justify-between text-sm font-bold">
                <span>{s.label}</span>
                <span>{s.value} / 5</span>
              </dt>
              <dd aria-hidden className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={cn("h-2.5 flex-1 rounded-full border-2 border-ink", n <= s.value ? (s.value >= 3 ? "bg-leaf" : "bg-sun") : "bg-card")}
                  />
                ))}
              </dd>
            </div>
          ))}
        </dl>

        <p>{review.feedback}</p>

        {review.suggestions.length > 0 && (
          <div className="space-y-1">
            <h4 className="font-bold">{flow.suggestionsTitle}</h4>
            <ul className="list-disc space-y-1 pl-5">
              {review.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{flow.aiDisclaimer}</p>
    </section>
  );
}
