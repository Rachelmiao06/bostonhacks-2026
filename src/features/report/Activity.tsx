"use client";

import { useEffect, useState } from "react";
import { fetchStatus } from "./api";
import { CaseRow, stageOfCity } from "./CaseRow";
import { content } from "./content";
import { demoStage } from "./demo-case";
import { loadCases, nowMs, saveCase } from "./store";
import { PrimaryButton } from "./ui";
import type { CityStatus, SavedCase, Stage } from "./types";

const PRIORITY: Record<Stage, number> = { closed: 0, in_progress: 1, sent: 2 };

/** Your activity: real Boston 311 cases you follow, and demo reports saved on this device. The two are never mixed. */
export function Activity({ highlight, onCamera }: { highlight?: string; onCamera: () => void }) {
  const [cases, setCases] = useState<SavedCase[]>([]);
  const [city, setCity] = useState<Record<string, CityStatus>>({});
  const [now, setNow] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [seenIds, setSeenIds] = useState<string[]>([]);

  // Reads browser storage after load (it does not exist on the server).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCases(loadCases());
    setNow(nowMs());
    setLoaded(true);
  }, []);

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
  const order = (a: SavedCase, b: SavedCase) => Number(wasUpdate(b)) - Number(wasUpdate(a)) || PRIORITY[stageOf(a)] - PRIORITY[stageOf(b)] || b.createdAt - a.createdAt;

  function seen(c: SavedCase, stage: Stage) {
    saveCase({ ...c, lastStage: stage });
    setSeenIds((ids) => [...ids, c.caseId]);
  }

  const group = (kind: SavedCase["kind"], title: string, note: string) => {
    const list = cases.filter((c) => c.kind === kind).sort(order);
    if (!list.length) return null;
    return (
      <section aria-label={title} className="grid grid-cols-[minmax(0,1fr)] gap-2">
        <div className="px-1">
          <h2 className="font-serif text-lg font-semibold">{title}</h2>
          <p className="text-xs text-taupe">{note}</p>
        </div>
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
          {list.map((c) => (
            <CaseRow key={c.caseId} c={c} stage={stageOf(c)} city={city[c.caseId]} fresh={c.caseId === highlight} unread={wasUpdate(c) && !seenIds.includes(c.caseId)} onOpen={seen} />
          ))}
        </ul>
      </section>
    );
  };

  if (!loaded) return <p className="text-sm text-taupe" aria-busy="true">{content.activity.loading}</p>;
  if (!cases.length) {
    return (
      <div className="grid justify-items-center gap-4 py-10 text-center">
        <p className="text-taupe">{content.activity.empty}</p>
        <PrimaryButton onClick={onCamera}>{content.activity.emptyCta}</PrimaryButton>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      {refreshFailed && (
        <p role="status" className="rounded-xl bg-stone-deep/50 px-3 py-2 text-xs text-taupe">
          {content.activity.refreshFailed}
        </p>
      )}
      {group("followed", content.activity.following, content.activity.followingNote)}
      {group("demo", content.activity.demos, content.activity.demosNote)}
    </div>
  );
}
