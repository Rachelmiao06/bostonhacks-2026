"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { content } from "./content";
import { demoClosedAt, demoNote } from "./demo-case";
import type { CityStatus, SavedCase, Stage } from "./types";

const ORDER: Stage[] = ["sent", "in_progress", "closed"];

/** Boston statuses other than In progress / Closed (Submit, Create, Needs Reallocation, Error) are shown as In progress. */
export const stageOfCity = (s: CityStatus | undefined): Stage => (s?.status === "Closed" ? "closed" : "in_progress");

const days = (from: string | number | null, to: string | number | null) => {
  if (!from || !to) return null;
  const ms = new Date(to).getTime() - new Date(from).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const h = ms / 3_600_000;
  return h < 1 ? "under an hour" : h < 48 ? `${Math.round(h)} hours` : `${Math.round(h / 24)} days`;
};

/** What the city said, in its own words. "Fixed by" only when Boston's closure reason is Resolved. */
function outcome(c: SavedCase, city: CityStatus | undefined) {
  if (c.kind === "demo") return { fixed: true, team: c.team, note: demoNote(c.serviceName), took: days(c.createdAt, demoClosedAt(c)) };
  const team = city?.team ?? c.team;
  const note = city?.closureComment?.trim() || null;
  const took = days(city?.openedAt ?? null, city?.closedAt ?? null);
  return { fixed: city?.closureReason === "Resolved", reason: city?.closureReason ?? null, team, note, took };
}

function headline(o: ReturnType<typeof outcome>) {
  if (o.fixed) return `Fixed by ${o.team}`;
  if ("reason" in o && o.reason === "Noted") return `${o.team} noted this report`;
  if ("reason" in o && o.reason === "Transitioned") return `${o.team} moved this to another process`;
  return `Closed by ${o.team}`;
}

export function CaseCard({ c, stage, city, fresh }: { c: SavedCase; stage: Stage; city?: CityStatus; fresh?: boolean }) {
  const at = ORDER.indexOf(stage);
  const done = stage === "closed" ? outcome(c, city) : null;
  return (
    <li className={cn("grid gap-3 rounded-2xl border bg-ivory p-4 text-graphite shadow-float", fresh ? "border-leaf" : "border-hairline")}>
      <div className="flex gap-3">
        {c.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.thumb} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="size-14 shrink-0 rounded-xl bg-stone-deep/60" />
        )}
        <div className="min-w-0">
          <p className="truncate font-medium">{c.serviceName}</p>
          <p className="truncate text-xs text-taupe">
            {c.caseId} · {c.kind === "demo" ? "Demo case: not sent to the city" : "Real 311 case you follow"}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-taupe">{c.description}</p>
        </div>
        {fresh && <span className="h-fit rounded-full bg-leaf px-2 py-0.5 text-xs font-medium text-ink">New</span>}
      </div>

      <ol className="flex items-center gap-2 text-xs" aria-label="Case progress">
        {ORDER.map((s, i) => (
          <li key={s} aria-current={i === at ? "step" : undefined} className={cn("flex items-center gap-1", i <= at ? "font-medium text-graphite" : "text-taupe")}>
            {i < at || stage === "closed" ? <Check className="size-3.5" /> : <Circle className={cn("size-3", i === at && "fill-graphite")} />}
            {content.stages[s]}
            {i < ORDER.length - 1 && <span className="mx-1 text-hairline">—</span>}
          </li>
        ))}
      </ol>

      {done && (
        <div className="rounded-xl bg-paper p-3">
          <p className="font-medium">{headline(done)}</p>
          {done.note && <p className="mt-1 text-sm">“{done.note}”</p>}
          {done.took && <p className="mt-1 text-xs text-taupe">Closed in {done.took}.</p>}
        </div>
      )}
    </li>
  );
}
