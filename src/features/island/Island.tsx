"use client";

import { useRef, useState } from "react";
import { stampCount, useMyProgress } from "@/features/explore/progress";
import { content, stagesFor, unlockTiers } from "./content";
import { IslandScene } from "./IslandLoader";

/** A knitted island that grows as the rider earns stamps. Full screen under the floating nav, like the map. */
export function Island() {
  const progress = useMyProgress();
  const [preview, setPreview] = useState(false);
  const [phase, setPhase] = useState("ball");
  const replay = useRef<(() => void) | null>(null);
  const stamps = progress.status === "ready" ? stampCount(progress.data) : 0;
  const total = unlockTiers.length;
  const shown = preview ? total : Math.min(stamps, total);
  const next = unlockTiers[shown];

  return (
    <section className="fixed inset-0 z-30 bg-stone font-ui text-graphite">
      {/* key: switching to or from the preview rebuilds the island with the new set of pieces */}
      <IslandScene
        key={String(preview)}
        stages={stagesFor(shown)}
        onReady={(fn) => (replay.current = fn)}
        onPhase={setPhase}
      />

      <div className="pointer-events-none absolute top-20 left-3 max-w-[18rem] sm:left-4">
        <div className="pointer-events-auto space-y-1 rounded-2xl border border-hairline bg-ivory/92 p-4 shadow-float backdrop-blur-md">
          <p className="font-mono text-[0.65rem] tracking-[0.16em] text-taupe uppercase">{content.eyebrow}</p>
          <h1 className="font-serif text-xl leading-tight font-semibold">{content.title}</h1>
          <p className="text-sm">{progress.status === "loading" ? content.progressUnknown : content.progress(stamps, total)}</p>
          <p className="text-xs text-taupe">
            {preview ? content.previewNote : next ? content.nextUnlock(next.name) : content.allUnlocked}
          </p>
          {/* Keyboard and no-drag alternative to pulling the thread */}
          {phase === "ball" && (
            <button
              type="button"
              onClick={() => replay.current?.()}
              className="mt-2 mr-2 inline-flex h-9 items-center rounded-full bg-graphite px-4 text-xs font-medium text-ivory outline-none hover:opacity-90 focus-visible:ring-4 focus-visible:ring-graphite/25"
            >
              {content.knitButton}
            </button>
          )}
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="mt-2 inline-flex h-9 items-center rounded-full border border-graphite/25 px-4 text-xs font-medium outline-none hover:border-graphite/50 focus-visible:ring-4 focus-visible:ring-graphite/20"
          >
            {preview ? content.previewOffLabel : content.previewLabel}
          </button>
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {phase === "ball" ? content.waiting : phase === "intro" ? content.knitting : phase === "idle" ? content.knitted : ""}
      </p>

      <p className="pointer-events-none absolute inset-x-0 bottom-3 px-4 text-center text-xs text-graphite/70">
        {content.hint} {content.soundHint}{" "}
        <a className="pointer-events-auto underline" href={content.creditUrl} target="_blank" rel="noreferrer">
          {content.credit}
        </a>
      </p>
    </section>
  );
}
