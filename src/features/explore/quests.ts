"use client";

import { useEffect, useState } from "react";
import type { Quest, QuestFeed } from "@/lib/mbta";
import { categoryOf, priorityOf } from "./category";
import { content, type CategoryId } from "./content";
import { takeQuestsDownload } from "./prefetch";
import type { SubwayStation } from "./types";

export type QuestState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "ready"; quests: Quest[]; source: QuestFeed["source"] };

/** Open problems from the existing /api/quests route (no extra MBTA call). Refreshed every few minutes. */
export function useQuests(): QuestState {
  const [state, setState] = useState<QuestState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    // The first load was already started by prefetch.ts; later refreshes fetch normally.
    let first = true;
    const download = (): Promise<QuestFeed> => {
      if (first) {
        first = false;
        return takeQuestsDownload();
      }
      return fetch("/api/quests").then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))));
    };
    const load = () =>
      download()
        .then((feed) => !cancelled && setState({ status: "ready", quests: feed.quests, source: feed.source }))
        // Keep the last good list if a refresh fails.
        .catch(() => !cancelled && setState((prev) => (prev.status === "ready" ? prev : { status: "failed" })));
    load();
    const timer = window.setInterval(load, content.questsRefreshMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return state;
}

/** One stop with problems on it, most urgent first. */
export type ProblemStop = {
  station: SubwayStation;
  quests: Quest[];
  /** The category the pin shows: the most urgent one at this stop. */
  top: CategoryId;
};

/**
 * Groups quests by the subway stop they belong to. Quests whose stop is not on the subway map
 * (bus or commuter rail only) cannot be placed, so they are left out.
 */
export function problemStops(quests: Quest[], stationById: Map<string, SubwayStation>, show: ReadonlySet<CategoryId>): ProblemStop[] {
  const byStation = new Map<string, Quest[]>();
  for (const quest of quests) {
    if (!show.has(categoryOf(quest))) continue;
    const id = quest.stationIds.find((sid) => stationById.has(sid));
    if (!id) continue;
    byStation.set(id, [...(byStation.get(id) ?? []), quest]);
  }
  return [...byStation].map(([id, list]) => {
    const sorted = [...list].sort((a, b) => priorityOf(categoryOf(a)) - priorityOf(categoryOf(b)) || b.daysOpen - a.daysOpen);
    return { station: stationById.get(id)!, quests: sorted, top: categoryOf(sorted[0]) };
  });
}

export type Cluster = { id: string; longitude: number; latitude: number; stops: ProblemStop[] };

/** Web-Mercator pixel position at a zoom level (256px tiles), so clustering matches what is on screen. */
function toPixels(longitude: number, latitude: number, zoom: number) {
  const scale = 256 * 2 ** zoom;
  const sin = Math.sin((latitude * Math.PI) / 180);
  return {
    x: ((longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

/**
 * Merges stops that would overlap on screen. The most urgent stops claim a spot first,
 * so a cluster sits where its most important problem is. Zoomed in far enough, nothing merges.
 */
export function clusterStops(stops: ProblemStop[], zoom: number): Cluster[] {
  const radius = content.clusterRadiusPx(zoom);
  const ordered = [...stops].sort((a, b) => priorityOf(a.top) - priorityOf(b.top) || b.quests.length - a.quests.length);
  const clusters: (Cluster & { x: number; y: number })[] = [];
  for (const stop of ordered) {
    const p = toPixels(stop.station.longitude, stop.station.latitude, zoom);
    const near = radius > 0 ? clusters.find((c) => Math.hypot(c.x - p.x, c.y - p.y) < radius) : undefined;
    if (near) near.stops.push(stop);
    else clusters.push({ id: stop.station.id, longitude: stop.station.longitude, latitude: stop.station.latitude, stops: [stop], ...p });
  }
  return clusters;
}
