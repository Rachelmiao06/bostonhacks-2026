// GET /api/quests: what a rider can do right now.
//   mode "report": an open MBTA alert (elevator, escalator, access, station, closure, shuttle, suspension).
//   mode "verify": an elevator or escalator MBTA closed in the last 24 hours. Needs the database.
// Optional filters: ?line=Green  ?mode=report|verify
import type { NextRequest } from "next/server";
import { hasDb, query } from "@/lib/db";
import { ACCESS_SOURCE_URL, VERIFY_REWARD_TOKENS, getQuests, type Quest, type QuestKind } from "@/lib/mbta";

type ResolvedRow = {
  alert_id: string; facility_id: string | null; kind: string; station_id: string | null; station_name: string;
  lines: string[]; header: string; cause: string; started_at: string; resolved_at: string;
};

async function enrich(quests: Quest[]): Promise<Quest[]> {
  const [failures, resolved] = await Promise.all([
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
  ]);
  const failuresOf = new Map(failures.map((f) => [f.facility_id, Number(f.n)]));
  const withCount = (q: Quest): Quest =>
    q.facilityId ? { ...q, failuresLast90Days: failuresOf.get(q.facilityId) ?? 1 } : q;

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
