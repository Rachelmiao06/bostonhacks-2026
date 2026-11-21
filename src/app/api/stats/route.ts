// GET /api/stats: every KPI for the stats page, computed from the database on each request.
// Outage numbers come from MBTA data (live sync + public archive). Rider numbers come from our submissions.
import { connection } from "next/server";
import { hasDb, query } from "@/lib/db";

const WINDOW_DAYS = 90;
const hours = (v: string | null) => (v === null ? null : Math.round(Number(v) * 10) / 10);

export async function GET() {
  await connection(); // always run at request time, never prebuilt
  if (!hasDb()) return Response.json({ error: "Database is not configured" }, { status: 503 });

  const [openByKind, longestOpen, fixTime, fixTrend, repeatOffenders, busiestStations, riders, history] =
    await Promise.all([
      query<{ kind: string; n: string }>(
        `SELECT kind, count(*) n FROM outages WHERE resolved_at IS NULL GROUP BY kind`,
      ),
      query<{ alert_id: string; station_name: string; header: string; kind: string; days_open: string }>(
        `SELECT alert_id, station_name, header, kind,
                floor(extract(epoch FROM now() - started_at) / 86400) days_open
         FROM outages WHERE resolved_at IS NULL ORDER BY started_at LIMIT 5`,
      ),
      query<{ kind: string; n: string; median_h: string | null; p90_h: string | null }>(
        `SELECT kind, count(*) n,
                percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM resolved_at - started_at) / 3600) median_h,
                percentile_cont(0.9) WITHIN GROUP (ORDER BY extract(epoch FROM resolved_at - started_at) / 3600) p90_h
         FROM outages
         WHERE resolved_at >= now() - make_interval(days => $1) AND resolved_at >= started_at
         GROUP BY kind`,
        [WINDOW_DAYS],
      ),
      query<{ month: string; n: string; median_h: string | null }>(
        `SELECT to_char(date_trunc('month', resolved_at AT TIME ZONE 'America/New_York'), 'YYYY-MM') AS month,
                count(*) n,
                percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM resolved_at - started_at) / 3600) median_h
         FROM outages
         WHERE resolved_at AT TIME ZONE 'America/New_York' >= date_trunc('month', now() AT TIME ZONE 'America/New_York') - interval '11 months'
           AND resolved_at >= started_at
         GROUP BY 1 ORDER BY 1`,
      ),
      query<{ facility_id: string; station_name: string; kind: string; outages: string }>(
        `SELECT facility_id, max(station_name) station_name, max(kind) kind, count(*) outages
         FROM outages
         WHERE facility_id IS NOT NULL AND started_at >= now() - make_interval(days => $1)
         GROUP BY facility_id HAVING count(*) >= 3 ORDER BY count(*) DESC, facility_id LIMIT 10`,
        [WINDOW_DAYS],
      ),
      query<{ station_name: string; outages: string }>(
        `SELECT station_name, count(*) outages FROM outages
         WHERE started_at >= now() - make_interval(days => $1)
         GROUP BY station_name ORDER BY count(*) DESC, station_name LIMIT 10`,
        [WINDOW_DAYS],
      ),
      query<{
        submissions: string; completed: string; riders: string; first_try: string; handed_off: string;
        open_outages: string; open_with_report: string; resolved_after_report: string;
      }>(
        `SELECT
           (SELECT count(*) FROM submissions) submissions,
           (SELECT count(*) FROM submissions WHERE status = 'completed') completed,
           (SELECT count(DISTINCT user_id) FROM submissions) riders,
           (SELECT count(*) FROM submissions WHERE status = 'completed' AND revision_count = 0) first_try,
           (SELECT count(*) FROM submissions WHERE status = 'completed' AND handed_off) handed_off,
           (SELECT count(*) FROM outages WHERE resolved_at IS NULL) open_outages,
           (SELECT count(*) FROM outages o WHERE resolved_at IS NULL
              AND EXISTS (SELECT 1 FROM submissions s WHERE s.alert_id = o.alert_id)) open_with_report,
           (SELECT count(*) FROM outages o WHERE resolved_at IS NOT NULL
              AND EXISTS (SELECT 1 FROM submissions s WHERE s.alert_id = o.alert_id AND s.status = 'completed'
                          AND s.completed_at < o.resolved_at)) resolved_after_report`,
      ),
      query<{ total: string; since: string | null; live_syncs: string }>(
        `SELECT (SELECT count(*) FROM outages) total,
                (SELECT min(started_at) FROM outages WHERE source = 'archive') since,
                (SELECT count(DISTINCT observed_at) FROM outage_observations) live_syncs`,
      ),
    ]);

  const r = riders[0];
  const completed = Number(r.completed);
  const openOutages = Number(r.open_outages);
  const share = (part: number, whole: number) => (whole === 0 ? null : Math.round((part / whole) * 100));

  return Response.json({
    generatedAt: new Date().toISOString(),
    outages: {
      openNow: {
        total: openOutages,
        byKind: Object.fromEntries(openByKind.map((k) => [k.kind, Number(k.n)])),
        longestOpen: longestOpen.map((o) => ({
          questId: o.alert_id, stationName: o.station_name, header: o.header, kind: o.kind, daysOpen: Number(o.days_open),
        })),
      },
      // How long MBTA took to close outages that ended in the last 90 days.
      timeToFix: {
        windowDays: WINDOW_DAYS,
        byKind: fixTime.map((k) => ({
          kind: k.kind, resolved: Number(k.n), medianHours: hours(k.median_h), p90Hours: hours(k.p90_h),
        })),
        byMonth: fixTrend.map((m) => ({ month: m.month, resolved: Number(m.n), medianHours: hours(m.median_h) })),
      },
      // Units that broke 3 or more times in the last 90 days.
      repeatOffenders: repeatOffenders.map((f) => ({
        facilityId: f.facility_id, stationName: f.station_name, kind: f.kind, outages: Number(f.outages),
      })),
      busiestStations: busiestStations.map((s) => ({ stationName: s.station_name, outages: Number(s.outages) })),
    },
    riders: {
      riders: Number(r.riders),
      submissions: Number(r.submissions),
      completed,
      // Share of open outages that have at least one rider report.
      coveragePercent: share(Number(r.open_with_report), openOutages),
      // Share of completed reports that needed at least one revision after the AI check.
      improvedByAiPercent: share(completed - Number(r.first_try), completed),
      // Share of completed reports where the rider opened MBTA's official form. Not proof of submission.
      handoffPercent: share(Number(r.handed_off), completed),
      // Outages MBTA resolved after a rider had reported them here. A correlation, never a cause.
      resolvedAfterReport: Number(r.resolved_after_report),
    },
    dataNotes: {
      totalOutagesOnRecord: Number(history[0].total),
      archiveStartsAt: history[0].since,
      liveSyncs: Number(history[0].live_syncs),
      sources: ["MBTA V3 API (live alerts)", "MBTA LAMP public alert archive", "T Party rider submissions"],
    },
  });
}
