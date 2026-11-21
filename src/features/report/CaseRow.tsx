"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { closureView } from "./closure";
import { content } from "./content";
import { demoClosedAt, demoInProgressAt, demoNote } from "./demo-case";
import { Chip } from "./ui";
import type { CityStatus, SavedCase, Stage } from "./types";

const ORDER: Stage[] = ["sent", "in_progress", "closed"];

/** Boston statuses other than In progress / Closed (Submit, Create, Needs Reallocation, Error) are shown as In progress. */
export const stageOfCity = (s: CityStatus | undefined): Stage => (s?.status === "Closed" ? "closed" : "in_progress");

const when = (v: string | number | null | undefined) => {
  if (v === null || v === undefined) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

/** What the city said, in its own words. "Fixed" only when the closure data supports it (see closure.ts). */
function outcome(c: SavedCase, city: CityStatus | undefined) {
  if (c.kind === "demo") return closureView(c.team, "Resolved", demoNote(c.serviceName));
  return closureView(city?.team ?? c.team, city?.closureReason ?? null, city?.closureComment ?? null);
}

function dates(c: SavedCase, city: CityStatus | undefined): Record<Stage, string | null> {
  if (c.kind === "demo") return { sent: when(c.createdAt), in_progress: when(demoInProgressAt(c)), closed: when(demoClosedAt(c)) };
  return { sent: when(city?.openedAt), in_progress: null, closed: when(city?.closedAt) };
}

/** One compact line per case. Opens to show progress and, once closed, the city's answer. */
export function CaseRow({ c, stage, city, fresh, unread, onOpen }: { c: SavedCase; stage: Stage; city?: CityStatus; fresh?: boolean; unread?: boolean; onOpen: (c: SavedCase, stage: Stage) => void }) {
  const [open, setOpen] = useState(false);
  const at = ORDER.indexOf(stage);
  const done = stage === "closed" ? outcome(c, city) : null;
  const when_ = dates(c, city);

  return (
    <li className={cn("rounded-2xl border bg-ivory/80 transition-colors", fresh ? "border-graphite/40" : "border-hairline")}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          if (!open) onOpen(c, stage);
        }}
        className="flex w-full items-center gap-3 rounded-2xl p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-graphite/50"
      >
        {c.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.thumb} alt="" className="size-11 shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="size-11 shrink-0 rounded-xl bg-stone-deep/60" aria-hidden />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{c.serviceName}</span>
          <span className="block truncate text-xs text-taupe">
            {c.team} · {c.kind === "demo" ? content.reports.demoTag : content.reports.realTag}
          </span>
        </span>
        {unread && <Chip tone="go">{content.reports.update}</Chip>}
        <Chip tone={stage === "closed" ? "go" : "quiet"}>{content.stages[stage]}</Chip>
        <ChevronDown className={cn("size-4 shrink-0 text-taupe transition-transform motion-reduce:transition-none", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div className="grid gap-3 border-t border-hairline p-3 text-sm">
          <p className="text-taupe">{c.description}</p>
          <ol className="grid gap-2" aria-label="Case progress">
            {ORDER.map((s, i) => (
              <li key={s} aria-current={i === at ? "step" : undefined} className="flex items-center gap-2">
                <span className={cn("grid size-5 place-items-center rounded-full border text-graphite", i <= at ? "border-graphite bg-graphite text-ivory" : "border-hairline")}>
                  {i <= at && <Check className="size-3" aria-hidden />}
                </span>
                <span className={cn(i <= at ? "font-medium" : "text-taupe")}>{content.stages[s]}</span>
                {when_[s] && i <= at && <span className="ml-auto text-xs text-taupe">{when_[s]}</span>}
              </li>
            ))}
          </ol>
          {done && (
            <div className="rounded-xl bg-stone-deep/40 p-3">
              <p className="font-medium">{done.headline}</p>
              {done.note && <p className="mt-1">“{done.note}”</p>}
              {done.reasonLine && <p className="mt-1 text-xs text-taupe">{done.reasonLine}</p>}
            </div>
          )}
          <p className="text-xs text-taupe">
            {c.caseId} · {c.kind === "demo" ? content.reports.demoNote : content.reports.realNote}
          </p>
        </div>
      )}
    </li>
  );
}
