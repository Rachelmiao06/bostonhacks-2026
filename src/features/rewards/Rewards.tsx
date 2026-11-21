"use client";

import { useState } from "react";
import { useCompleted } from "@/features/explore/progress";
import { Button } from "@/components/ui/button";
import { content, stagesFor, unlockTiers } from "./content";
import { IslandScene } from "./RewardsLoader";

export function Rewards() {
  const completed = useCompleted();
  const [preview, setPreview] = useState(false);
  const done = completed.size;
  const total = unlockTiers.length;
  const shown = preview ? total : Math.min(done, total);
  const next = unlockTiers[shown];

  return (
    <section className="fixed inset-0 z-30 bg-paper pt-16">
      <div className="absolute inset-x-0 bottom-0 top-16">
        {/* key: switching to or from the preview rebuilds the island with the new set of pieces */}
        <IslandScene key={String(preview)} stages={stagesFor(shown)} />
      </div>

      <div className="pointer-events-none absolute left-4 top-[5rem] flex max-w-xs flex-col gap-2">
        <div className="pointer-events-auto rounded-lg border border-ink/20 bg-paper/90 p-3 text-ink shadow-sm">
          <h1 className="font-pixel text-[0.7rem]">{content.title}</h1>
          <p className="mt-1 text-sm">{content.progress(done, total)}</p>
          <p className="mt-1 text-xs text-ink/70">
            {preview ? content.previewNote : next ? content.nextUnlock(next.name) : content.allUnlocked}
          </p>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => setPreview((p) => !p)}>
            {preview ? content.previewOffLabel : content.previewLabel}
          </Button>
        </div>
      </div>

      <p className="pointer-events-none absolute inset-x-0 bottom-3 px-4 text-center text-xs text-ink/70">
        {content.hint} {content.soundHint}{" "}
        <a
          className="pointer-events-auto underline"
          href={content.creditUrl}
          target="_blank"
          rel="noreferrer"
        >
          {content.credit}
        </a>
      </p>
    </section>
  );
}
