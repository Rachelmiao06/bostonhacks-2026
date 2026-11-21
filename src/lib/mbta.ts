// MBTA V3 API: the one place that talks to MBTA and the one definition of a Quest.
// A Quest is one real MBTA alert a rider can stand in front of:
// a broken elevator or escalator, an access issue, a station problem or a service disruption.
// Docs: https://www.mbta.com/developers/v3-api
import { cacheLife } from "next/cache";
import snapshot from "./data/mbta-alerts-snapshot.json";
import stationData from "./data/stations.json";

export type QuestKind =
  | "elevator"
  | "escalator"
  | "access"
  | "station" // something at a station is closed or changed (a stairway, a platform section)
  | "closure" // a whole station is closed or skipped
  | "shuttle" // buses replace trains
  | "suspension"; // no service on a stretch of line

export type Quest = {
  /** MBTA alert id. Stable for the life of the alert. */
  id: string;
  kind: QuestKind;
  /**
   * What the rider is asked to do.
   * "report": the problem is open now, describe what you see (goes through the AI check).
   * "verify": MBTA closed this in the last day, confirm it really works again (one tap, no AI check).
   */
  mode: "report" | "verify";
  /** MBTA unit id, e.g. "433". Only for elevators and escalators. Same id across repeat outages. */
  facilityId: string | null;
  /** e.g. "Maverick Escalator 433 (Unpaid lobby to Maverick Square)". For other kinds, MBTA's sentence. */
  facilityName: string;
  /** First affected station, e.g. "place-mvbcl". Use this to place the marker on the map. */
  stationId: string | null;
  stationName: string;
  /** Every affected station. More than one for shuttles and suspensions. */
  stationIds: string[];
  /** Subway lines: "Red" | "Orange" | "Blue" | "Green" | "Mattapan". Empty for bus or commuter rail only. */
  lines: string[];
  /** MBTA's own sentence describing the alert. */
  header: string;
  /** e.g. "MAINTENANCE", "UNKNOWN_CAUSE" */
  cause: string;
  startedAt: string;
  /** MBTA's planned end, when it gives one. */
  expectedEnd: string | null;
  daysOpen: number;
  /** False when MBTA lists the alert but it is between active periods (e.g. a weekend-only shuttle on a Tuesday). */
  activeNow: boolean;
  status: "open" | "resolved";
  /** Only for verify quests: when MBTA closed it. */
  resolvedAt?: string;
  /** How many times this unit has been out in the last 90 days, counting this one. Set when the database is available. */
  failuresLast90Days?: number;
  /** Always a T Party mission built from real MBTA data, never an official MBTA request for comment. */
  type: "community_mission";
  sourceUrl: string;
  rewardTokens: number;
};

export type QuestFeed = {
  quests: Quest[];
  /** "snapshot" means MBTA could not be reached and this is saved data from snapshotTakenAt. */
  source: "live" | "snapshot";
  fetchedAt: string;
};

export type Station = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** "Red" | "Orange" | "Blue" | "Green" | "Mattapan" */
  lines: string[];
  /** MBTA route ids, with Green split into branches: "Green-B", "Green-C", "Green-D", "Green-E". */
  routes: string[];
};

/** All 125 subway stations, and the station order along each route. Saved from MBTA on 2026-11-21. */
export const stations = stationData.stations as Station[];
export const routeOrder = stationData.routeOrder as Record<string, string[]>;

// Two questions to MBTA, merged: everything about accessibility (any mode), and everything on the subway.
const ALERT_URLS = [
  "https://api-v3.mbta.com/alerts?filter%5Bactivity%5D=USING_WHEELCHAIR,USING_ESCALATOR&include=facilities,stops",
  "https://api-v3.mbta.com/alerts?filter%5Broute_type%5D=0,1&include=facilities,stops",
];
export const ACCESS_SOURCE_URL = "https://www.mbta.com/alerts/access";
const SUBWAY_SOURCE_URL = "https://www.mbta.com/alerts/subway";
export const REWARD_TOKENS = 10;
/** Tokens the author earns for each like stamp another rider presses on their completed report. */
export const LIKE_REWARD_TOKENS = 1;
export const VERIFY_REWARD_TOKENS = 5;
/** When src/lib/data/mbta-alerts-snapshot.json was saved. */
export const snapshotTakenAt = "2026-11-21T17:36:00Z";

const KIND_BY_EFFECT: Record<string, QuestKind> = {
  ELEVATOR_CLOSURE: "elevator",
  ESCALATOR_CLOSURE: "escalator",
  ACCESS_ISSUE: "access",
  STATION_ISSUE: "station",
  STATION_CLOSURE: "closure",
  SHUTTLE: "shuttle",
  SUSPENSION: "suspension",
};
const ACCESS_KINDS: QuestKind[] = ["elevator", "escalator", "access"];

type RawEntity = { stop?: string; route?: string; route_type?: number; facility?: string };
type RawAlert = {
  id: string;
  attributes: {
    effect: string;
    cause: string;
    header: string;
    active_period: { start: string | null; end: string | null }[];
    informed_entity: RawEntity[];
  };
};
type RawIncluded = {
  id: string;
  type: string;
  attributes: { name?: string | null; long_name?: string | null };
  relationships?: {
    stop?: { data: { id: string } | null };
    parent_station?: { data: { id: string } | null } | null;
  };
};
type RawFeed = { data: RawAlert[]; included?: RawIncluded[] };

function lineName(route: string): string {
  return route.startsWith("Green") ? "Green" : route;
}

/** Turns MBTA's raw alert feed into our Quest list. Pure: same input, same output. */
export function toQuests(raw: RawFeed, now: Date): Quest[] {
  const included = raw.included ?? [];
  const facilities = new Map(included.filter((i) => i.type === "facility").map((i) => [i.id, i]));
  const stops = new Map(included.filter((i) => i.type === "stop").map((i) => [i.id, i]));
  const nowMs = now.getTime();
  const stationOf = (stopId: string | undefined): string | null => {
    if (!stopId) return null;
    if (stopId.startsWith("place-")) return stopId;
    return stops.get(stopId)?.relationships?.parent_station?.data?.id ?? null;
  };

  const quests = new Map<string, Quest>();
  for (const alert of raw.data) {
    const a = alert.attributes;
    const kind = KIND_BY_EFFECT[a.effect];
    const startedAt = a.active_period[0]?.start;
    // Planned alerts that have not begun yet are not quests: there is nothing to see at the station.
    if (!kind || !startedAt || new Date(startedAt).getTime() > nowMs) continue;

    const entities = a.informed_entity;
    const lines = [
      ...new Set(
        entities
          .filter((e) => e.route && (e.route_type === 0 || e.route_type === 1))
          .map((e) => lineName(e.route as string)),
      ),
    ].sort();
    const isAccess = ACCESS_KINDS.includes(kind);
    // Station and service alerts are only quests on the subway, where our map is.
    if (!isAccess && lines.length === 0) continue;

    const facilityId = isAccess ? (entities.find((e) => e.facility)?.facility ?? null) : null;
    const facility = facilityId ? facilities.get(facilityId) : undefined;
    const stationIds = [...new Set(entities.map((e) => stationOf(e.stop)).filter((s): s is string => s !== null))];
    const stationId = facility?.relationships?.stop?.data?.id ?? stationIds[0] ?? null;
    const activeNow = a.active_period.some(
      (p) => p.start !== null && new Date(p.start).getTime() <= nowMs && (p.end === null || new Date(p.end).getTime() > nowMs),
    );

    quests.set(alert.id, {
      id: alert.id,
      kind,
      mode: "report",
      facilityId,
      facilityName: facility?.attributes.long_name ?? a.header,
      stationId,
      stationName:
        (stationId && stops.get(stationId)?.attributes.name) ||
        entities.map((e) => e.stop && stops.get(e.stop)?.attributes.name).find(Boolean) ||
        "Unknown station",
      stationIds: stationId && !stationIds.includes(stationId) ? [stationId, ...stationIds] : stationIds,
      lines,
      header: a.header,
      cause: a.cause,
      startedAt,
      expectedEnd: a.active_period.at(-1)?.end ?? null,
      daysOpen: Math.max(0, Math.floor((nowMs - new Date(startedAt).getTime()) / 86_400_000)),
      activeNow,
      status: "open",
      type: "community_mission",
      sourceUrl: isAccess ? ACCESS_SOURCE_URL : SUBWAY_SOURCE_URL,
      rewardTokens: REWARD_TOKENS,
    });
  }
  // Newest first: they are the ones a rider is most likely to meet today.
  return [...quests.values()].sort((x, y) => new Date(y.startedAt).getTime() - new Date(x.startedAt).getTime());
}

function mbtaHeaders(): HeadersInit | undefined {
  // Without a key MBTA allows 20 requests a minute per network address, shared with everyone
  // else on that address. With a free key the limit is per key.
  const key = process.env.MBTA_API_KEY;
  return key ? { "x-api-key": key } : undefined;
}

/** Asks MBTA for current alerts. Cached for 5 minutes so we stay far below MBTA's rate limit. */
async function fetchLiveQuests(): Promise<QuestFeed> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });

  const feeds = await Promise.all(
    ALERT_URLS.map(async (url) => {
      const res = await fetch(url, { headers: mbtaHeaders(), signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`MBTA API answered ${res.status}`);
      const raw = (await res.json()) as RawFeed;
      if (!Array.isArray(raw.data)) throw new Error("MBTA API answer has no data list");
      return raw;
    }),
  );
  // An alert or stop can come back from both questions; toQuests keeps one of each id.
  const merged: RawFeed = {
    data: feeds.flatMap((f) => f.data),
    included: feeds.flatMap((f) => f.included ?? []),
  };

  const now = new Date();
  return { quests: toQuests(merged, now), source: "live", fetchedAt: now.toISOString() };
}

let lastSyncedAt: string | undefined;

/** The open quest list every page should use. Never throws: falls back to the saved snapshot. */
export async function getQuests(): Promise<QuestFeed> {
  let feed: QuestFeed;
  try {
    feed = await fetchLiveQuests();
  } catch (error) {
    console.error("MBTA fetch failed, serving snapshot:", error);
    return {
      quests: toQuests(snapshot as RawFeed, new Date()),
      source: "snapshot",
      fetchedAt: snapshotTakenAt,
    };
  }

  // Save each fresh MBTA answer once (about every 5 minutes). Snapshot data is never saved,
  // so an MBTA outage cannot be mistaken for a wave of fixes.
  if (feed.fetchedAt !== lastSyncedAt) {
    const { hasDb, syncOutages } = await import("./db");
    if (hasDb()) {
      try {
        await syncOutages(feed.quests, feed.fetchedAt);
        lastSyncedAt = feed.fetchedAt;
      } catch (error) {
        console.error("Could not save outages to the database:", error);
      }
    }
  }
  return feed;
}

export type Train = {
  id: string;
  /** "Red" | "Orange" | "Blue" | "Green" | "Mattapan" */
  line: string;
  /** MBTA route id, e.g. "Green-D". */
  route: string;
  /** 0 or 1. Which way along the route order in `routeOrder`: 0 follows it, 1 runs against it. */
  direction: number;
  /** The station the train is at or heading to. */
  stationId: string | null;
  /** "STOPPED_AT" | "INCOMING_AT" | "IN_TRANSIT_TO" */
  status: string;
  lat: number;
  lon: number;
  /** Compass heading in degrees, when MBTA gives one. */
  bearing: number | null;
  updatedAt: string;
};

type RawVehicle = {
  id: string;
  attributes: {
    current_status: string;
    direction_id: number;
    latitude: number;
    longitude: number;
    bearing: number | null;
    updated_at: string;
  };
  relationships: { route: { data: { id: string } | null }; stop: { data: { id: string } | null } };
};

/** Where every subway train is right now. Cached for 15 seconds. Throws if MBTA cannot be reached. */
export async function getTrains(): Promise<{ trains: Train[]; fetchedAt: string }> {
  "use cache";
  cacheLife({ stale: 15, revalidate: 15, expire: 60 });

  const res = await fetch("https://api-v3.mbta.com/vehicles?filter%5Broute_type%5D=0,1&include=stop", {
    headers: mbtaHeaders(),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`MBTA API answered ${res.status}`);
  const raw = (await res.json()) as { data: RawVehicle[]; included?: RawIncluded[] };
  const parentOf = new Map(
    (raw.included ?? []).map((s) => [s.id, s.relationships?.parent_station?.data?.id ?? null]),
  );

  const trains = raw.data
    .filter((v) => v.relationships.route.data && typeof v.attributes.latitude === "number")
    .map((v): Train => {
      const route = v.relationships.route.data!.id;
      const stopId = v.relationships.stop.data?.id;
      return {
        id: v.id,
        line: lineName(route),
        route,
        direction: v.attributes.direction_id,
        stationId: stopId ? (stopId.startsWith("place-") ? stopId : (parentOf.get(stopId) ?? null)) : null,
        status: v.attributes.current_status,
        lat: v.attributes.latitude,
        lon: v.attributes.longitude,
        bearing: v.attributes.bearing,
        updatedAt: v.attributes.updated_at,
      };
    });
  return { trains, fetchedAt: new Date().toISOString() };
}
