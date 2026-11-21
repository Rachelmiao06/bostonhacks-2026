"use client";

import Link from "next/link";
import { PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { content } from "./content";
import { challengeHref } from "./links";
import { PhotoField } from "./PhotoField";
import { ReviewPanel } from "./ReviewPanel";
import type { Quest } from "./sample-quests";
import type { AppState } from "./storage";
import { useSubmission, type SubmissionHint } from "./useSubmission";

const HINT_TEXT: Record<Exclude<SubmissionHint, null>, string> = {
  add_content: content.needSomething,
  needs_check: content.completeNeedsCheck,
  needs_pass: content.completeNeedsPass,
};

// Presentation only. All rules live in useSubmission.ts. Restyle freely, keep using the hook.
export function SubmitForm({ quest, state }: { quest: Quest; state: AppState }) {
  const s = useSubmission(quest, state);

  return (
    <div className="space-y-6">
      {s.completed && (
        <section role="status" className="space-y-2 rounded-2xl border-2 border-ink bg-leaf p-5 text-ink shadow-tile">
          <h3 className="flex items-center gap-2 font-heading text-xl font-bold">
            <PartyPopper aria-hidden /> {content.completedTitle}
          </h3>
          <p className="font-bold">+{s.rewardTokens} tokens</p>
          <p className="text-sm">{content.completedBody}</p>
          <p className="text-sm">
            To report the issue officially, use{" "}
            <a className="font-bold underline" href={content.officialUrl} target="_blank" rel="noreferrer">
              {content.officialLabel}
            </a>
            . Opening that link does not change your quest status.
          </p>
        </section>
      )}

      <div className="space-y-2">
        <label htmlFor="feedback" className="font-heading text-lg font-bold">
          {content.textLabel}
        </label>
        <p id="feedback-hint" className="text-sm text-paper/80">
          {content.textHint}
        </p>
        <textarea
          id="feedback"
          aria-describedby="feedback-hint"
          value={s.text}
          disabled={s.completed}
          onChange={(e) => s.setText(e.target.value)}
          placeholder={content.textPlaceholder}
          rows={6}
          className="min-h-40 w-full resize-y rounded-2xl border-2 border-ink bg-paper p-4 text-base text-ink shadow-chip outline-none placeholder:text-muted-foreground focus-visible:ring-4 focus-visible:ring-sky/60 disabled:opacity-70"
        />
        {!s.completed && s.status !== "empty" && <p className="text-xs text-paper/70">{content.savedIndicator}</p>}
      </div>

      <PhotoField
        photo={s.photo}
        error={s.photoError}
        disabled={s.completed}
        onPick={s.pickPhoto}
        onRemove={s.removePhoto}
      />

      {!s.completed && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" size="lg" disabled={!s.canCheck} onClick={s.check}>
              {s.checking ? content.checking : content.checkWithAi}
            </Button>
            <Button type="button" size="lg" variant="secondary" disabled={!s.canComplete} onClick={s.complete}>
              {content.complete}
            </Button>
          </div>
          {s.hint && <p className="text-sm text-paper/80">{HINT_TEXT[s.hint]}</p>}
        </div>
      )}

      {s.aiError && (
        <p role="alert" className="rounded-xl border-2 border-ink bg-cherry px-3 py-2 text-sm font-bold text-paper">
          {s.aiError}
        </p>
      )}

      {s.review && <ReviewPanel result={s.review.result} isCurrent={s.review.isCurrent} />}

      {s.rewarded && !s.completed && <p className="text-sm text-paper/80">{content.alreadyRewarded}</p>}

      <p className="text-sm">
        <Link href={challengeHref()} className="font-bold text-sky underline-offset-4 hover:underline">
          ← {content.backToList}
        </Link>
      </p>
    </div>
  );
}
