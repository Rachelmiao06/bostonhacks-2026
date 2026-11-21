"use client";

import { useEffect, useState } from "react";
import { selectedStationId } from "@/features/explore/viewMemory";
import type { NearbyPlace } from "@/lib/places";

/**
 * Real places near the rider's selected MBTA station, from our own server (which asks Google Places).
 * - "no-station": the rider has not picked a stop on the map yet, so there is nowhere to search. Location is never asked
 *   for here, and the rider's own position is never sent anywhere.
 * - "unavailable": the lookup failed or is not set up. The island and the gifts still work (they fall back to the demo).
 * Nothing is stored: Google's terms do not allow keeping place content.
 */
export type PlacesState =
  | { status: "loading" }
  | { status: "no-station" }
  | { status: "unavailable" }
  | { status: "ready"; stationName: string; places: NearbyPlace[] };

export function useNearbyPlaces(enabled: boolean): PlacesState {
  // Read once when the island is shown (it only renders in the browser, after its plan is made).
  const [stationId] = useState(() => selectedStationId());
  const [state, setState] = useState<PlacesState>(() => (stationId ? { status: "loading" } : { status: "no-station" }));

  useEffect(() => {
    if (!enabled || !stationId) return;
    let live = true;
    fetch(`/api/places/nearby?stationId=${encodeURIComponent(stationId)}`)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<{ station: { name: string }; places: NearbyPlace[] }>;
      })
      .then((data) => live && setState({ status: "ready", stationName: data.station.name, places: data.places }))
      .catch(() => live && setState({ status: "unavailable" }));
    return () => {
      live = false;
    };
  }, [enabled, stationId]);

  return state;
}
