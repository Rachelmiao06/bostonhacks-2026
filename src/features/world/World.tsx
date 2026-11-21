"use client";

import { useState } from "react";
import { PixelTrain } from "@/components/shared/pixel-train";
import { cn } from "@/lib/utils";
import { Island } from "@/features/island/Island";
import { stampCount, useMyProgress, type MyProgress } from "@/features/explore/progress";
import { Community } from "./Community";
import { content } from "./content";
import { Journey } from "./Journey";

type Tab = "journey" | "community";

/**
 * My World: the island you grow, what you have earned, and the small community of riders.
 * One page in place of My Journey, Collection and the standalone island. Everything counted comes from the server.
 */
export function World() {
  const progress = useMyProgress();
  const [tab, setTab] = useState<Tab>("journey");

  return (
    <article className="space-y-6 font-ui text-graphite">
      <header className="space-y-1.5">
        <p className="font-mono text-[0.65rem] tracking-[0.16em] text-taupe uppercase">{content.eyebrow}</p>
        <h1 className="font-serif text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{content.title}</h1>
        {progress.status === "ready" && (
          <p className="text-sm text-taupe">{content.summary(progress.data.completedQuestIds.length, progress.data.verifiedQuestIds.length)}</p>
        )}
      </header>

      <Island embedded />

      {progress.status === "ready" && <Totals data={progress.data} />}
      {progress.status === "unavailable" && (
        <p role="alert" className="text-sm text-taupe">
          {content.unavailable}
        </p>
      )}

      <div className="space-y-5">
        <div role="tablist" aria-label={content.eyebrow} className="flex gap-1 border-b border-hairline">
          {(["journey", "community"] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`world-tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`world-panel-${id}`}
              onClick={() => setTab(id)}
              className={cn(
                "-mb-px cursor-pointer border-b-2 px-3.5 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-graphite/30",
                tab === id ? "border-graphite text-graphite" : "border-transparent text-taupe hover:text-graphite",
              )}
            >
              {content.tabs[id]}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`world-panel-${tab}`} aria-labelledby={`world-tab-${tab}`}>
          {tab === "journey" && progress.status === "loading" && <p className="text-sm text-taupe">{content.loading}</p>}
          {tab === "journey" && progress.status === "ready" && <Journey data={progress.data} />}
          {tab === "community" && <Community />}
        </div>
      </div>

      <p className="border-t border-hairline pt-4 text-xs text-taupe">{content.honest}</p>
    </article>
  );
}

/** Token total printed like the fare on a ticket, with stamps and the like stamps riders pressed on your reports. */
function Totals({ data }: { data: MyProgress }) {
  const likes = data.likesReceived ?? 0;
  return (
    <section className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-hairline bg-ivory p-5 shadow-float">
      <div className="space-y-1">
        <p className="flex items-baseline gap-2">
          <span className="font-serif text-5xl leading-none font-semibold tabular-nums">{data.tokenBalance}</span>
          <span className="font-pixel text-[0.6rem] text-taupe">{content.tokens}</span>
        </p>
        <p className="max-w-md text-xs text-taupe">{content.tokensNote}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-2">
          <PixelTrain size={44} body="fill-cat-verify" />
          <span className="font-pixel text-[0.55rem] text-graphite">{content.stamps(stampCount(data))}</span>
        </div>
        <span className="text-xs text-taupe">{content.likesReceived(likes)}</span>
      </div>
    </section>
  );
}
