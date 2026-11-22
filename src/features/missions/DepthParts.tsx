"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import type { Quest, QuestChecks, QuestFeed } from "@/lib/mbta";
import { useMyProgress } from "@/features/explore/progress";
import { glassClass, glassStyle } from "@/features/explore/glass";
import { cn } from "@/lib/utils";
import { depth as words } from "./content";
import { impactOf, mbtaNotes, statusOf } from "./depth";

const card = "rounded-2xl bg-graphite/6 p-4";
const label = "text-xs font-medium tracking-wide text-taupe uppercase";

/** Overview: the one status block. How long, who says so, whether any rider has checked. */
export function StatusBlock({ quest }: { quest: Quest }) {
  const [now] = useState(() => new Date());
  const status = statusOf(quest, now);
  return (
    <section className="space-y-1.5 rounded-2xl bg-graphite/6 p-4">
      <p className="flex items-center gap-2.5 text-lg leading-snug font-semibold text-graphite">
        <Clock className="size-5 shrink-0 text-taupe" aria-hidden />
        {status.headline}
      </p>
      <p className="text-[0.95rem] leading-snug text-taupe">{status.trust}</p>
      {status.extra && <p className="text-[0.95rem] leading-snug text-taupe">{status.extra}</p>}
    </section>
  );
}

/**
 * Overview, below the main action: MBTA's own explanation and step-free directions.
 * A quiet secondary action, so it never competes with the start button. Renders nothing when MBTA wrote nothing.
 */
export function MbtaMore({ quest }: { quest: Quest }) {
  const { about, ways } = mbtaNotes(quest.description);
  const [open, setOpen] = useState(false);
  if (!about && ways.length === 0) return null;
  return (
    <section className="space-y-3">
      {ways.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-semibold text-graphite">{words.routeAsk}</p>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            style={glassStyle}
            className={cn(glassClass, "h-11 shrink-0 px-4 text-sm")}
          >
            {open ? words.routeHide : words.routeShow}
          </button>
        </div>
      )}
      {open && (
        <div className="space-y-2.5">
          <ul className="space-y-2.5">
            {ways.map((way) => (
              <li key={way} className="text-[0.95rem] leading-relaxed text-graphite">{way}</li>
            ))}
          </ul>
          <p className="text-sm leading-snug text-taupe">{words.routeNote}</p>
        </div>
      )}
      {about && (
        <p className="text-[0.95rem] leading-relaxed text-graphite/85">
          <span className="font-semibold">{words.fromMbta}: </span>
          {about}
        </p>
      )}
    </section>
  );
}

/** Done: what this check added, from real counts. Says nothing when the count is unknown. */
export function YourImpact({ checks, already, verify }: { checks: QuestChecks | undefined; already: boolean; verify: boolean }) {
  const [now] = useState(() => new Date());
  const impact = impactOf(checks, already, verify, now);
  if (!impact) return null;
  return (
    <section aria-label={words.impactTitle} className={cn(card, "space-y-1")}>
      <p className={label}>{words.impactTitle}</p>
      <p className="text-base font-semibold text-graphite">{impact.headline}</p>
      {impact.detail && <p className="text-sm leading-snug text-taupe">{impact.detail}</p>}
    </section>
  );
}

/** Today's missions on one line, from the same /api/quests route the map uses. Null until loaded or if it fails. */
function useLineMissions(line: string | undefined): string[] | null {
  const [ids, setIds] = useState<string[] | null>(null);
  useEffect(() => {
    if (!line) return;
    let cancelled = false;
    fetch(`/api/quests?line=${encodeURIComponent(line)}`)
      .then((res) => (res.ok ? (res.json() as Promise<QuestFeed>) : Promise.reject(new Error(String(res.status)))))
      .then((feed) => !cancelled && setIds(feed.quests.map((q) => q.id)))
      .catch(() => undefined); // an extra: without it the done screen is simply shorter
    return () => {
      cancelled = true;
    };
  }, [line]);
  return ids;
}

const MAX_SEGMENTS = 16;

/** Done: how much of this line's missions the rider has checked. The next goal, not a new reward. */
export function LineProgress({ quest }: { quest: Quest }) {
  const line = quest.lines[0];
  const ids = useLineMissions(line);
  const progress = useMyProgress();
  if (!line || !ids || ids.length < 2 || progress.status !== "ready") return null;
  const total = ids.length;
  const done = ids.filter((id) => progress.done.has(id)).length;
  if (done === 0) return null; // this mission is not on the list yet: show nothing rather than "0 of n"
  return (
    <section aria-label={words.lineProgress(line, done, total)} className={cn(card, "space-y-2.5")}>
      <p className={label}>{words.lineTitle(line, done, total)}</p>
      <div role="progressbar" aria-label={words.lineProgress(line, done, total)} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} className="flex gap-1">
        {total <= MAX_SEGMENTS ? (
          ids.map((id, i) => <span key={id} className={cn("h-2 flex-1 rounded-full", i < done ? "bg-cat-verify" : "bg-graphite/12")} />)
        ) : (
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-graphite/12">
            <span className="block h-full rounded-full bg-cat-verify" style={{ width: `${(done / total) * 100}%` }} />
          </span>
        )}
      </div>
      <p className="text-sm text-taupe">{done < total ? words.lineMore(total - done) : words.lineDone(line)}</p>
    </section>
  );
}
