"use client";

import { useEffect, useState } from "react";
import { fetchStatus } from "./api";
import { CaseRow, stageOfCity } from "./CaseRow";
import { content } from "./content";
import { demoStage } from "./demo-case";
import { loadCases, nowMs, saveCase } from "./store";
import { Panel } from "./ui";
import type { CityStatus, SavedCase, Stage } from "./types";

const SHOWN = 3;
const PRIORITY: Record<Stage, number> = { closed: 0, in_progress: 1, sent: 2 };

/** Your cases and what the city said. Real cases are refreshed from Boston's 311 data; updates float to the top. */
export function MyReports({ highlight }: { highlight?: string }) {
  const [cases, setCases] = useState<SavedCase[]>([]);
  const [city, setCity] = useState<Record<string, CityStatus>>({});
  const [now, setNow] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [all, setAll] = useState(false);
  const [seenIds, setSeenIds] = useState<string[]>([]);

  // Reads browser storage after load (it does not exist on the server).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCases(loadCases());
    setNow(nowMs());
    setLoaded(true);
  }, [highlight]);

  // Demo cases move on a timer, so tick; real cases are fetched.
  useEffect(() => {
    const t = setInterval(() => setNow(nowMs()), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const ids = cases.filter((c) => c.kind === "followed").map((c) => c.caseId);
    if (!ids.length) return;
    let live = true;
    const load = () =>
      fetchStatus(ids)
        .then((rows) => {
          if (!live) return;
          setCity(Object.fromEntries(rows.map((r) => [r.caseId, r])));
          setRefreshFailed(false);
        })
        .catch(() => live && setRefreshFailed(true)); // keep the last known status; never invent one
    load();
    const t = setInterval(load, 60_000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [cases]);

  const stageOf = (c: SavedCase): Stage => (c.kind === "demo" ? demoStage(c, now) : stageOfCity(city[c.caseId]));
  // Order uses what was true when the list loaded; opening a row clears its dot without making the row jump away.
  const wasUpdate = (c: SavedCase) => c.lastStage !== undefined && c.lastStage !== stageOf(c);

  function seen(c: SavedCase, stage: Stage) {
    saveCase({ ...c, lastStage: stage });
    setSeenIds((ids) => [...ids, c.caseId]);
  }

  const sorted = [...cases].sort((a, b) => Number(wasUpdate(b)) - Number(wasUpdate(a)) || PRIORITY[stageOf(a)] - PRIORITY[stageOf(b)] || b.createdAt - a.createdAt);
  const shown = all ? sorted : sorted.slice(0, SHOWN);

  return (
    <section aria-labelledby="my-reports" className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <div className="flex items-baseline justify-between px-1">
        <h2 id="my-reports" className="font-serif text-xl font-semibold">
          {content.reports.title}
        </h2>
        {sorted.length > SHOWN && (
          <button onClick={() => setAll((a) => !a)} className="rounded-lg text-sm text-taupe underline underline-offset-4 outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/50">
            {all ? content.reports.showLess : content.reports.viewAll(sorted.length)}
          </button>
        )}
      </div>

      {!loaded ? (
        <Panel className="text-sm text-taupe" aria-busy="true">
          {content.reports.loading}
        </Panel>
      ) : sorted.length === 0 ? (
        <Panel className="text-sm text-taupe">{content.reports.empty}</Panel>
      ) : (
        <>
          {refreshFailed && (
            <p role="status" className="rounded-xl bg-stone-deep/50 px-3 py-2 text-xs text-taupe">
              {content.reports.refreshFailed}
            </p>
          )}
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
            {shown.map((c) => (
              <CaseRow key={c.caseId} c={c} stage={stageOf(c)} city={city[c.caseId]} fresh={c.caseId === highlight} unread={wasUpdate(c) && !seenIds.includes(c.caseId)} onOpen={seen} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
