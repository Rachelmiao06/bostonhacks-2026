"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { DiveGate, type GatePhase, type LoadStatus, type LocateError } from "./DiveGate";
import { markSeen, welcomedOnLoad } from "./onboarding";
import { startPrefetch } from "./prefetch";
import { clearReturnFromIsland, isReturningFromIsland } from "./viewMemory";
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
  // Back from the island with a saved camera: skip the gate and resume the map. Read once, then cleared (see viewMemory.ts),
  // so a first visit, or a later fresh visit, still gets the gate and the dive.
  const flagged = useSyncExternalStore(nothingToWatch, isReturningFromIsland, () => false);
  const [returning, setReturning] = useState(false);
  if (flagged && !returning) setReturning(true); // latch it, because the flag is cleared right after
  useEffect(() => {
    if (returning) clearReturnFromIsland();
  }, [returning]);
  // Someone who has already been welcomed on this browser goes straight to the map: no card, no dive.
  const welcomed = useSyncExternalStore(nothingToWatch, welcomedOnLoad, () => false);
  const skipGate = deepLinked || flagged || returning || welcomed;
  const entry = skipGate ? ATLAS : chosen;
  const [phase, setPhase] = useState<GatePhase | "gone">("gate");
  const [status, setStatus] = useState(NOTHING_READY);
  const [error, setError] = useState<LocateError | null>(null);

  const locate = useCallback(() => {
    setError(null);
    if (!("geolocation" in navigator)) return setError("unsupported");
    setPhase("locating");
    const found = (pos: GeolocationPosition) => {
      setEntry({ kind: "geo", lat: pos.coords.latitude, lng: pos.coords.longitude });
      setPhase("waiting");
      markSeen("welcomed");
    };
    const failed = (err: GeolocationPositionError) => {
      setError(err.code === err.PERMISSION_DENIED ? "denied" : err.code === err.TIMEOUT ? "timeout" : "unavailable");
      setPhase("gate");
    };
    // A coarse fix is quick, but some laptops cannot give one. If that fails (and it was not a refusal), try once more with the GPS-grade request and more time.
    navigator.geolocation.getCurrentPosition(
      found,
      (err) => {
        if (err.code === err.PERMISSION_DENIED) return failed(err);
        navigator.geolocation.getCurrentPosition(found, failed, { enableHighAccuracy: true, timeout: 15000, maximumAge: 10 * 60 * 1000 });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );
  }, []);

  // At page load: start the downloads, skip the gate for shared links, and for riders who already
  // said yes to location on an earlier visit, go straight in.
  useEffect(() => {
    startPrefetch();
    if (new URLSearchParams(window.location.search).has("quest") || welcomedOnLoad()) return;
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
      {/* The first-map hint belongs only to a visit that began with the welcome and chose a starting place. */}
      <ExploreMap entry={entry} onStatus={onStatus} onReveal={onReveal} guided={!skipGate && (chosen.kind === "geo" || chosen.kind === "spot")} />
      {!skipGate && phase !== "gone" && (
        <DiveGate
          phase={phase}
          status={status}
          error={error}
          onLocate={locate}
          onSpot={(stationId) => {
            setEntry({ kind: "spot", stationId });
            setPhase("waiting");
            markSeen("welcomed");
          }}
          onSkip={() => {
            // Skipping is complete in itself: the card leaves at once and the map takes over as it loads.
            setEntry({ kind: "atlas" });
            setPhase("revealing");
            markSeen("welcomed");
          }}
          onGone={onGone}
        />
      )}
    </>
  );
}
