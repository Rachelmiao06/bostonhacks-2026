"use client";

import { useEffect, useState } from "react";
import type { Quest, QuestChecks, QuestFeed } from "@/lib/mbta";
import { useMyProgress } from "@/features/explore/progress";
import { cn } from "@/lib/utils";
import { depth as words } from "./content";
import { impactOf, mbtaNotes, storyFacts } from "./depth";

const card = "rounded-2xl border border-graphite/12 bg-ivory/70 p-4";
const label = "text-xs font-medium tracking-wide text-taupe uppercase";

/** Overview: how long, how often, until when, and MBTA's own explanation. Only facts that exist are shown. */
export function Story({ quest }: { quest: Quest }) {
  const [now] = useState(() => new Date());
  const facts = storyFacts(quest, now);
  const { about } = mbtaNotes(quest.description);
  if (facts.length === 0 && !about) return null;
  return (
    <section aria-label={words.storyTitle} className={cn(card, "space-y-3")}>
      <p className={label}>{words.storyTitle}</p>
      {facts.length > 0 && (
        <dl className="flex gap-2">
          {facts.map((f) => (
            <div key={f.label} className="min-w-0 flex-1 rounded-xl bg-graphite/6 px-2.5 py-2">
              <dd className="text-lg leading-tight font-semibold text-graphite">{f.value}</dd>
              <dt className="mt-0.5 text-xs leading-snug text-taupe">{f.label}</dt>
            </div>
          ))}
        </dl>
      )}
      {about && (
        <p className="text-sm leading-relaxed text-graphite/85">
          <span className="font-semibold">{words.fromMbta}: </span>
          {about}
        </p>
      )}
    </section>
  );
}

/** Overview: MBTA's own step-free directions around the problem. Hidden when MBTA wrote none. */
export function WayAround({ quest }: { quest: Quest }) {
  const { ways } = mbtaNotes(quest.description);
  if (ways.length === 0) return null;
  const [first, ...rest] = ways;
  return (
    <section aria-label={words.wayTitle} className={cn(card, "space-y-2")}>
      <p className={label}>{words.wayTitle}</p>
      <p className="text-[0.95rem] leading-relaxed text-graphite">{first}</p>
      {rest.length > 0 && (
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center text-[0.95rem] font-semibold text-graphite underline decoration-graphite/30 underline-offset-4 outline-none hover:decoration-graphite focus-visible:ring-4 focus-visible:ring-graphite/25 group-open:hidden [&::-webkit-details-marker]:hidden">
            {words.wayMore(rest.length)}
          </summary>
          <ul className="space-y-2">
            {rest.map((way) => (
              <li key={way} className="text-[0.95rem] leading-relaxed text-graphite">{way}</li>
            ))}
          </ul>
        </details>
      )}
      <p className="text-xs leading-snug text-taupe">{words.wayNote}</p>
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
