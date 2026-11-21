"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { PixelTrain } from "@/components/shared/pixel-train";
import { cn } from "@/lib/utils";
import { Island } from "@/features/island/Island";
import { stampCount, useMyProgress, type MyProgress } from "@/features/explore/progress";
import { Community } from "./Community";
import { content } from "./content";
import { Journey } from "./Journey";

type Tab = "journey" | "community";
const TABS: Tab[] = ["journey", "community"];

const pill =
  "inline-flex h-10 cursor-pointer items-center rounded-full border border-hairline bg-ivory/92 px-4 text-sm font-medium text-graphite shadow-float backdrop-blur-md outline-none hover:bg-ivory focus-visible:ring-4 focus-visible:ring-graphite/20";

/**
 * My World: you walk into the island, full screen. Your journey and the community of riders are a panel you
 * open over it and close again. One page in place of My Journey, Collection and the standalone island.
 * Everything counted comes from the server.
 */
export function World() {
  const progress = useMyProgress();
  const [open, setOpen] = useState<Tab | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <Island eyebrow={content.eyebrow} title={content.title}>
      {open === null ? (
        <div className="absolute inset-x-3 bottom-40 z-10 flex flex-wrap items-center justify-center gap-2 sm:inset-x-auto sm:top-20 sm:right-4 sm:bottom-auto sm:justify-end">
          {progress.status === "ready" && (
            <span className="flex h-10 items-center gap-2 rounded-full border border-hairline bg-ivory/92 pr-4 pl-2.5 text-sm font-medium shadow-float backdrop-blur-md">
              <PixelTrain size={22} body="fill-cat-verify" />
              <span className="tabular-nums">
                {progress.data.tokenBalance} {content.tokens}
              </span>
            </span>
          )}
          {TABS.map((id) => (
            <button key={id} type="button" onClick={() => setOpen(id)} className={pill}>
              {content.tabs[id]}
            </button>
          ))}
        </div>
      ) : (
        <aside
          aria-label={content.eyebrow}
          className="absolute inset-x-2 top-20 bottom-2 z-10 flex flex-col overflow-hidden rounded-3xl border border-hairline bg-ivory/97 font-ui text-graphite shadow-float backdrop-blur-md sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[27rem]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-hairline pr-2 pl-2">
            <div role="tablist" aria-label={content.eyebrow} className="flex">
              {TABS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`world-tab-${id}`}
                  aria-selected={open === id}
                  aria-controls="world-panel"
                  onClick={() => setOpen(id)}
                  className={cn(
                    "-mb-px cursor-pointer border-b-2 px-3 py-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-graphite/30",
                    open === id ? "border-graphite text-graphite" : "border-transparent text-taupe hover:text-graphite",
                  )}
                >
                  {content.tabs[id]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label={content.close}
              className="grid size-9 cursor-pointer place-items-center rounded-full text-taupe outline-none hover:bg-stone-deep/60 hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/30"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <div role="tabpanel" id="world-panel" aria-labelledby={`world-tab-${open}`} className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4">
            {progress.status === "ready" && <Totals data={progress.data} />}
            {progress.status === "unavailable" && (
              <p role="alert" className="text-sm text-taupe">
                {content.unavailable}
              </p>
            )}
            {open === "journey" && progress.status === "loading" && <p className="text-sm text-taupe">{content.loading}</p>}
            {open === "journey" && progress.status === "ready" && <Journey data={progress.data} />}
            {open === "community" && <Community />}
            <p className="border-t border-hairline pt-3 text-xs text-taupe">
              {content.tokensNote} {content.honest}
            </p>
          </div>
        </aside>
      )}
    </Island>
  );
}

/** Token total, stamps, and the like stamps riders pressed on your reports. */
function Totals({ data }: { data: MyProgress }) {
  return (
    <section className="flex items-end justify-between gap-3 rounded-2xl border border-hairline bg-ivory p-4">
      <p className="flex items-baseline gap-2">
        <span className="font-serif text-4xl leading-none font-semibold tabular-nums">{data.tokenBalance}</span>
        <span className="font-pixel text-[0.55rem] text-taupe">{content.tokens}</span>
      </p>
      <div className="space-y-0.5 text-right">
        <p className="font-pixel text-[0.5rem] text-graphite">{content.stamps(stampCount(data))}</p>
        <p className="text-xs text-taupe">{content.likesReceived(data.likesReceived ?? 0)}</p>
      </div>
    </section>
  );
}
