"use client";

import { useEffect, useState } from "react";
import { fetchStatus } from "./api";
import { CaseCard, stageOfCity } from "./CaseCard";
import { content } from "./content";
import { demoStage } from "./demo-case";
import { loadCases, nowMs } from "./store";
import type { CityStatus, SavedCase } from "./types";

/** The heart of the tab: your cases and what the city said. Real cases are refreshed from Boston's 311 data. */
export function MyReports({ highlight }: { highlight?: string }) {
  const [cases, setCases] = useState<SavedCase[]>([]);
  const [city, setCity] = useState<Record<string, CityStatus>>({});
  const [now, setNow] = useState(0);
  const [loaded, setLoaded] = useState(false);

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
        .then((rows) => live && setCity(Object.fromEntries(rows.map((r) => [r.caseId, r]))))
        .catch(() => {}); // keep the last known status; never invent one
    load();
    const t = setInterval(load, 60_000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [cases]);

  if (!loaded) return null;
  return (
    <section aria-labelledby="my-reports" className="grid gap-3">
      <h2 id="my-reports" className="font-serif text-xl font-semibold text-graphite">
        {content.myReports}
      </h2>
      {cases.length === 0 ? (
        <p className="text-sm text-taupe">{content.noReports}</p>
      ) : (
        <ul className="grid gap-3">
          {cases.map((c) => {
            const stage = c.kind === "demo" ? demoStage(c, now) : stageOfCity(city[c.caseId]);
            return <CaseCard key={c.caseId} c={c} stage={stage} city={city[c.caseId]} fresh={c.caseId === highlight} />;
          })}
        </ul>
      )}
    </section>
  );
}
