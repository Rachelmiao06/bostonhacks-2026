// GET /api/quests: what a rider can do right now.
//   mode "report": an open MBTA alert (elevator, escalator, access, station, closure, shuttle, suspension).
//   mode "verify": an elevator or escalator MBTA closed in the last 24 hours. Needs the database.
// Optional filters: ?line=Green  ?mode=report|verify
import type { NextRequest } from "next/server";
import { hasDb, query } from "@/lib/db";
import { ACCESS_SOURCE_URL, VERIFY_REWARD_TOKENS, getQuests, type Quest, type QuestChecks, type QuestKind } from "@/lib/mbta";

type ResolvedRow = {
  alert_id: string; facility_id: string | null; kind: string; station_id: string | null; station_name: string;
  lines: string[]; header: string; cause: string; started_at: string; resolved_at: string;
};

type CheckRow = { alert_id: string; riders: number; last_at: string | null; working: number; still_broken: number };

/** Rider checks per alert: counts only, no rider id leaves the server. Empty if the tables are not set up yet. */
async function checkCounts(): Promise<CheckRow[]> {
  try {
    return await query<CheckRow>(
      `SELECT alert_id, count(DISTINCT user_id)::int AS riders, max(at) AS last_at,
              (count(*) FILTER (WHERE verdict = 'working'))::int AS working,
              (count(*) FILTER (WHERE verdict = 'still_broken'))::int AS still_broken
       FROM (SELECT alert_id, user_id, completed_at AS at, NULL::text AS verdict FROM submissions WHERE status = 'completed'
             UNION ALL
             SELECT alert_id, user_id, created_at, verdict FROM verifications) c
       GROUP BY alert_id`,
    );
  } catch (error) {
    console.error("Could not count rider checks:", error);
    return [];
  }
}

async function enrich(quests: Quest[]): Promise<Quest[]> {
  const [failures, resolved, checks] = await Promise.all([
    query<{ facility_id: string; n: string }>(
      `SELECT facility_id, count(*) n FROM outages
       WHERE facility_id IS NOT NULL AND started_at >= now() - interval '90 days' GROUP BY facility_id`,
    ),
    query<ResolvedRow>(
      `SELECT alert_id, facility_id, kind, station_id, station_name, lines, header, cause, started_at, resolved_at
       FROM outages
       WHERE resolved_at >= now() - interval '24 hours' AND kind IN ('elevator', 'escalator') AND station_id IS NOT NULL
       ORDER BY resolved_at DESC LIMIT 30`,
    ),
    checkCounts(),
  ]);
  const checksOf = new Map(
    checks.map((c): [string, QuestChecks] => [
      c.alert_id,
      { riders: c.riders, lastAt: c.last_at ? new Date(c.last_at).toISOString() : null, working: c.working, stillBroken: c.still_broken },
    ]),
  );
  const NO_CHECKS: QuestChecks = { riders: 0, lastAt: null, working: 0, stillBroken: 0 };
  const failuresOf = new Map(failures.map((f) => [f.facility_id, Number(f.n)]));
  const withCount = (q: Quest): Quest => ({
    ...q,
    ...(q.facilityId ? { failuresLast90Days: failuresOf.get(q.facilityId) ?? 1 } : {}),
    checks: checksOf.get(q.id) ?? NO_CHECKS,
  });

  const openIds = new Set(quests.map((q) => q.id));
  const verify = resolved
    .filter((r) => !openIds.has(r.alert_id))
    .map((r): Quest =>
      withCount({
        id: r.alert_id,
        kind: r.kind as QuestKind,
        mode: "verify",
        facilityId: r.facility_id,
        // MBTA headers read "<unit name> is unavailable ..."; keep the unit name.
        facilityName: r.header.split(" is unavailable")[0],
        stationId: r.station_id,
        stationName: r.station_name,
        stationIds: r.station_id ? [r.station_id] : [],
        lines: r.lines,
        header: r.header,
        description: null,
        cause: r.cause,
        startedAt: new Date(r.started_at).toISOString(),
        expectedEnd: null,
        daysOpen: 0,
        activeNow: false,
        status: "resolved",
        resolvedAt: new Date(r.resolved_at).toISOString(),
        type: "community_mission",
        sourceUrl: ACCESS_SOURCE_URL,
        rewardTokens: VERIFY_REWARD_TOKENS,
      }),
    );
  return [...quests.map(withCount), ...verify];
}

export async function GET(request: NextRequest) {
  const line = request.nextUrl.searchParams.get("line")?.toLowerCase();
  const mode = request.nextUrl.searchParams.get("mode");
  const feed = await getQuests();

  let quests = feed.quests;
  if (hasDb()) {
    try {
      quests = await enrich(quests);
    } catch (error) {
      // The open quests still work without the database; verify quests and failure counts are extras.
      console.error("Could not add verify quests and failure counts:", error);
    }
  }
  if (line) quests = quests.filter((q) => q.lines.some((l) => l.toLowerCase() === line));
  if (mode) quests = quests.filter((q) => q.mode === mode);
  return Response.json({ ...feed, quests });
}
