"use client";

import { useCallback, useRef, useState } from "react";
import { stampCount, useMyProgress } from "@/features/explore/progress";
import { content, stagesFor, unlockTiers } from "./content";
import { IslandScene } from "./IslandLoader";
import type { Status } from "./IslandScene";

/** A knitted island that grows as the rider earns stamps. Full screen under the floating nav, like the map. */
export function Island() {
  const progress = useMyProgress();
  const [preview, setPreview] = useState(false);
  const stamps = progress.status === "ready" ? stampCount(progress.data) : 0;
  const total = unlockTiers.length;
  const shown = preview ? total : Math.min(stamps, total);
  const next = unlockTiers[shown];

  // how the opening is going, and the no-drag way to run it
  const [status, setStatus] = useState<Status>({ phase: "", progress: 0 });
  const knit = useRef<(() => void) | null>(null);
  const onReady = useCallback((c: { replay: () => void; knit: () => void }) => {
    knit.current = c.knit;
  }, []);
  const pct = Math.round(status.progress * 100);
  const opening = status.phase === "ball" || status.phase === "knitting";

  return (
    <section className="fixed inset-0 z-30 bg-stone font-ui text-graphite">
      {/* key: switching to or from the preview rebuilds the island with the new set of pieces */}
      <IslandScene key={String(preview)} stages={stagesFor(shown)} onReady={onReady} onStatus={setStatus} />

      <div className="pointer-events-none absolute top-20 left-3 max-w-[18rem] sm:left-4">
        <div className="pointer-events-auto space-y-1 rounded-2xl border border-hairline bg-ivory/92 p-4 shadow-float backdrop-blur-md">
          <p className="font-mono text-[0.65rem] tracking-[0.16em] text-taupe uppercase">{content.eyebrow}</p>
          <h1 className="font-serif text-xl leading-tight font-semibold">{content.title}</h1>
          <p className="text-sm">{progress.status === "loading" ? content.progressUnknown : content.progress(stamps, total)}</p>
          <p className="text-xs text-taupe">
            {preview ? content.previewNote : next ? content.nextUnlock(next.name) : content.allUnlocked}
          </p>
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="mt-2 inline-flex h-9 items-center rounded-full border border-graphite/25 px-4 text-xs font-medium outline-none hover:border-graphite/50 focus-visible:ring-4 focus-visible:ring-graphite/20"
          >
            {preview ? content.previewOffLabel : content.previewLabel}
          </button>
        </div>
      </div>

      {/* screen readers hear the opening's progress; sighted users see the same words below */}
      <p className="sr-only" role="status" aria-live="polite">
        {status.phase === "knitting" ? content.knitting(pct - (pct % 10)) : status.phase === "ready" ? content.knitted : ""}
      </p>

      {opening && (
        <div className="pointer-events-none absolute inset-x-0 bottom-28 flex sm:bottom-14 flex-col items-center gap-1 px-4 text-center">
          {status.phase === "ball" ? (
            <>
              <p className="font-serif text-lg text-graphite/85 italic">{content.pullInstruction}</p>
              <button
                type="button"
                onClick={() => knit.current?.()}
                className="pointer-events-auto inline-flex h-10 items-center rounded-full border border-graphite/25 bg-ivory/92 px-5 text-sm font-medium text-graphite shadow-float outline-none backdrop-blur-md hover:border-graphite/50 focus-visible:ring-4 focus-visible:ring-graphite/20"
              >
                {content.knitButton}
              </button>
              <span className="text-xs text-graphite/70">{content.knitButtonNote}</span>
            </>
          ) : (
            <span className="rounded-full bg-ivory/92 px-4 py-1.5 text-xs text-graphite/80 shadow-float backdrop-blur-md">
              {content.knitting(pct)}
            </span>
          )}
        </div>
      )}

      <p className="pointer-events-none absolute inset-x-0 bottom-3 px-4 text-center text-xs text-graphite/70">
        {opening ? content.pullHint : content.hint} {content.soundHint}{" "}
        <a className="pointer-events-auto underline" href={content.creditUrl} target="_blank" rel="noreferrer">
          {content.credit}
        </a>
      </p>
    </section>
  );
}
