"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { DiveGate, type GatePhase, type LoadStatus } from "./DiveGate";
import { startPrefetch } from "./prefetch";
import type { Entry } from "./world";

// MapLibre needs the browser (WebGL, window), so the map is never rendered on the server.
// Next.js only allows `ssr: false` inside a Client Component, which is why this file exists.
// The map is large: it downloads behind the gate while the rider chooses how to start.
const ExploreMap = dynamic(() => import("./ExploreMap"), { ssr: false });

const NOTHING_READY: LoadStatus = {
  streets: false,
  lines: false,
  problems: false,
};

/**
 * The shell around the map: the arrival gate on top, the map behind it.
 * A shared link such as /?quest=<id> skips the gate and opens the full map, as before.
 */
const nothingToWatch = () => () => {};
const ATLAS: Entry = { kind: "atlas" };

export function ExploreLoader() {
  // A shared link (?quest=...) is known only in the browser; the server render assumes there is none.
  const deepLinked = useSyncExternalStore(nothingToWatch, () => new URLSearchParams(window.location.search).has("quest"), () => false);
  const [chosen, setEntry] = useState<Entry>({ kind: "pending" });
  const entry = deepLinked ? ATLAS : chosen;
  const [phase, setPhase] = useState<GatePhase | "gone">("gate");
  const [status, setStatus] = useState(NOTHING_READY);
  const [denied, setDenied] = useState(false);

  const locate = useCallback(() => {
    setDenied(false);
    if (!("geolocation" in navigator)) return setDenied(true);
    setPhase("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEntry({
          kind: "geo",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setPhase("waiting");
      },
      () => {
        setDenied(true);
        setPhase("gate");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );
  }, []);

  // At page load: start the downloads, skip the gate for shared links, and for riders who already
  // said yes to location on an earlier visit, go straight in.
  useEffect(() => {
    startPrefetch();
    if (new URLSearchParams(window.location.search).has("quest")) return;
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((permission) => permission.state === "granted" && locate())
      .catch(() => {});
  }, [locate]);

  const onStatus = useCallback(
    (next: LoadStatus) =>
      setStatus((prev) => (prev.streets === next.streets && prev.lines === next.lines && prev.problems === next.problems && prev.failed === next.failed ? prev : next)),
    [],
  );
  const onReveal = useCallback(() => setPhase((p) => (p === "gone" ? p : "revealing")), []);
  const onGone = useCallback(() => setPhase("gone"), []);

  return (
    <>
      {/* The paper under the map, so the first frame is never blank while the map code arrives. */}
      <div aria-hidden className="fixed inset-0 z-30 bg-stone" />
      <ExploreMap entry={entry} onStatus={onStatus} onReveal={onReveal} />
      {!deepLinked && phase !== "gone" && (
        <DiveGate
          phase={phase}
          status={status}
          denied={denied}
          onLocate={locate}
          onSpot={(stationId) => {
            setEntry({ kind: "spot", stationId });
            setPhase("waiting");
          }}
          onSkip={() => {
            setEntry({ kind: "atlas" });
            setPhase("waiting");
          }}
          onGone={onGone}
        />
      )}
    </>
  );
}
