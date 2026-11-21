// MBTA V3 API: the one place that talks to MBTA and the one definition of a Quest.
// A Quest is one live accessibility outage (elevator, escalator or access issue).
// Docs: https://www.mbta.com/developers/v3-api
import { cacheLife } from "next/cache";
import snapshot from "./data/mbta-alerts-snapshot.json";

export type QuestKind = "elevator" | "escalator" | "access";

export type Quest = {
  /** MBTA alert id. Stable for the life of the outage. */
  id: string;
  kind: QuestKind;
  /** MBTA unit id, e.g. "433". Stays the same across repeat outages of the same unit. */
  facilityId: string | null;
  /** e.g. "Maverick Escalator 433 (Unpaid lobby to Maverick Square)" */
  facilityName: string;
  /** Parent station id, e.g. "place-mvbcl". Use this to place the marker on the map. */
  stationId: string | null;
  stationName: string;
  /** Subway lines at this outage: "Red" | "Orange" | "Blue" | "Green" | "Mattapan". Empty for bus or commuter rail only. */
  lines: string[];
  /** MBTA's own sentence describing the outage. */
  header: string;
  /** e.g. "MAINTENANCE", "UNKNOWN_CAUSE" */
  cause: string;
  startedAt: string;
  /** MBTA's planned end, when it gives one. */
  expectedEnd: string | null;
  daysOpen: number;
  status: "open" | "resolved";
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

const ALERTS_URL =
  "https://api-v3.mbta.com/alerts?filter%5Bactivity%5D=USING_WHEELCHAIR,USING_ESCALATOR&include=facilities,stops";
const SOURCE_URL = "https://www.mbta.com/alerts/access";
export const REWARD_TOKENS = 10;
/** When src/lib/data/mbta-alerts-snapshot.json was saved. */
export const snapshotTakenAt = "2026-11-21T16:20:00Z";

const KIND_BY_EFFECT: Record<string, QuestKind> = {
  ELEVATOR_CLOSURE: "elevator",
  ESCALATOR_CLOSURE: "escalator",
  ACCESS_ISSUE: "access",
};

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
  attributes: { name?: string; long_name?: string };
  relationships?: { stop?: { data: { id: string } | null } };
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

  const quests: Quest[] = [];
  for (const alert of raw.data) {
    const a = alert.attributes;
    const kind = KIND_BY_EFFECT[a.effect];
    const startedAt = a.active_period[0]?.start;
    if (!kind || !startedAt) continue;

    const entities = a.informed_entity;
    const facilityId = entities.find((e) => e.facility)?.facility ?? null;
    const facility = facilityId ? facilities.get(facilityId) : undefined;
    const stationId =
      facility?.relationships?.stop?.data?.id ??
      entities.find((e) => e.stop?.startsWith("place-"))?.stop ??
      null;
    const lines = [
      ...new Set(
        entities
          .filter((e) => e.route && (e.route_type === 0 || e.route_type === 1))
          .map((e) => lineName(e.route as string)),
      ),
    ].sort();

    quests.push({
      id: alert.id,
      kind,
      facilityId,
      facilityName: facility?.attributes.long_name ?? a.header,
      stationId,
      stationName:
        (stationId && stops.get(stationId)?.attributes.name) ||
        entities.map((e) => e.stop && stops.get(e.stop)?.attributes.name).find(Boolean) ||
        "Unknown station",
      lines,
      header: a.header,
      cause: a.cause,
      startedAt,
      expectedEnd: a.active_period[0]?.end ?? null,
      daysOpen: Math.max(0, Math.floor((now.getTime() - new Date(startedAt).getTime()) / 86_400_000)),
      status: "open",
      type: "community_mission",
      sourceUrl: SOURCE_URL,
      rewardTokens: REWARD_TOKENS,
    });
  }
  // Newest outages first: they are the ones a rider is most likely to meet today.
  return quests.sort((x, y) => new Date(y.startedAt).getTime() - new Date(x.startedAt).getTime());
}

/** Asks MBTA for current outages. Cached for 5 minutes so we stay far below MBTA's rate limit. */
async function fetchLiveQuests(): Promise<QuestFeed> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });

  const key = process.env.MBTA_API_KEY;
  const res = await fetch(ALERTS_URL, {
    headers: key ? { "x-api-key": key } : undefined,
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`MBTA API answered ${res.status}`);
  const raw = (await res.json()) as RawFeed;
  if (!Array.isArray(raw.data)) throw new Error("MBTA API answer has no data list");

  const now = new Date();
  return { quests: toQuests(raw, now), source: "live", fetchedAt: now.toISOString() };
}

let lastSyncedAt: string | undefined;

/** The quest list every page should use. Never throws: falls back to the saved snapshot. */
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
