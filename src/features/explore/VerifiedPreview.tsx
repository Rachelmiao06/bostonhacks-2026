"use client";

import { useState } from "react";
import { PinFace } from "./ProblemMarker";
import { AtlasButton } from "./ui";
import type { Verified } from "./verified";

/** A fixed clock, so the sample always reads "42 min ago". */
const NOW = Date.parse("2026-11-21T18:00:00Z");

/** Fixed sample so the page looks the same every time. The rider count is sample data: no live source exists yet. */
const SAMPLES: { title: string; note: string; category: "access" | "station"; count: number; verified?: Verified }[] = [
  { title: "Active", note: "Open MBTA alert: warning colour", category: "access", count: 1 },
  { title: "Active, 2 problems", note: "Open MBTA alerts: warning colour and count", category: "station", count: 2 },
  { title: "MBTA resolved", note: "Source: MBTA alert closed", category: "access", count: 1, verified: { source: "mbta", at: "2026-11-21T17:18:00Z" } },
  { title: "Rider reports", note: "Source: riders (sample count)", category: "access", count: 1, verified: { source: "riders", count: 3 } },
];

/** /explore/verified: an active marker and verified markers side by side, labels always shown. */
export function VerifiedPreview() {
  const [run, setRun] = useState(0);
  return (
    <main className="mx-auto max-w-3xl space-y-6 bg-stone px-4 pt-20 pb-10 font-ui text-graphite">
      <header className="space-y-1">
        <h1 className="font-serif text-2xl font-semibold">Marker states</h1>
        <p className="text-sm text-taupe">Green only appears when the source is named. Reduced Motion shows the stamp without movement.</p>
      </header>
      <div key={run} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SAMPLES.map((s) => (
          <figure key={s.title} className="grid justify-items-center gap-3 rounded-xl border border-hairline bg-ivory px-2 pt-16 pb-3 text-center">
            <div className="relative flex flex-col items-center">
              <PinFace category={s.category} count={s.count} doneCount={0} selected={false} compact={false} verified={s.verified} showLabel now={NOW} />
            </div>
            <figcaption className="space-y-0.5">
              <p className="text-sm font-semibold">{s.title}</p>
              <p className="text-xs text-taupe">{s.note}</p>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <AtlasButton onClick={() => setRun((n) => n + 1)}>Replay stamp</AtlasButton>
        <span className="flex items-center gap-2 text-xs text-taupe">
          Zoomed out:
          {SAMPLES.filter((s, i) => i === 0 || i === 2).map((s) => (
            <span key={s.title} className="flex flex-col items-center">
              <PinFace category={s.category} count={s.count} doneCount={0} selected={false} compact verified={s.verified} />
            </span>
          ))}
        </span>
      </div>
    </main>
  );
}
