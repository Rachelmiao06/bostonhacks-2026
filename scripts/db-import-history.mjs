// One-off: load past MBTA outages (from scripts/export-history.py) into the outages table.
// Run: node --env-file=.env.local scripts/db-import-history.mjs history.json
// Safe to run again. For outages our own sync already marked as fixed, this replaces our
// detection time with MBTA's exact close time.
import { readFileSync } from "node:fs";
import pg from "pg";

const KIND = { ELEVATOR_CLOSURE: "elevator", ESCALATOR_CLOSURE: "escalator", ACCESS_ISSUE: "access" };
const history = JSON.parse(readFileSync(process.argv[2], "utf8"));

// MBTA's list of elevators and escalators tells us which station each unit belongs to.
const res = await fetch(
  "https://api-v3.mbta.com/facilities?filter%5Btype%5D=ELEVATOR,ESCALATOR&include=stop&page%5Blimit%5D=1000",
  { headers: process.env.MBTA_API_KEY ? { "x-api-key": process.env.MBTA_API_KEY } : undefined },
);
const facilities = await res.json();
const stopNames = new Map((facilities.included ?? []).map((s) => [s.id, s.attributes.name]));
const stationOf = new Map(facilities.data.map((f) => [f.id, f.relationships.stop.data?.id ?? null]));

const iso = (seconds) => new Date(seconds * 1000).toISOString();
const rows = history.map((h) => {
  const stationId = h.station_id ?? stationOf.get(h.facility_id) ?? null;
  // Fallback name: MBTA headers start with the station, e.g. "Maverick Escalator 433 (...) is unavailable".
  const fromHeader = (h.header ?? "").split(/ (Elevator|Escalator) /)[0];
  return {
    alert_id: h.alert_id,
    facility_id: h.facility_id,
    kind: KIND[h.effect],
    station_id: stationId,
    station_name: stopNames.get(stationId) ?? (fromHeader.length < 60 && fromHeader) ?? "Unknown station",
    lines: [...new Set((h.routes ?? []).map((r) => (r.startsWith("Green") ? "Green" : r)))].sort(),
    header: h.header ?? "",
    cause: h.cause ?? "UNKNOWN_CAUSE",
    started_at: iso(h.started),
    first_seen_at: iso(h.created),
    resolved_at: iso(h.closed),
  };
});

const url = new URL(process.env.DATABASE_URL);
url.searchParams.set("uselibpqcompat", "true");
const client = new pg.Client({ connectionString: url.toString() });
await client.connect();
let inserted = 0;
for (let i = 0; i < rows.length; i += 2000) {
  const result = await client.query(
    `INSERT INTO outages (alert_id, facility_id, kind, station_id, station_name, lines, header, cause,
                          started_at, first_seen_at, last_seen_at, resolved_at, source, resolved_source)
     SELECT r.alert_id, r.facility_id, r.kind, r.station_id, r.station_name,
            ARRAY(SELECT jsonb_array_elements_text(r.lines)), r.header, r.cause,
            r.started_at, r.first_seen_at, r.resolved_at, r.resolved_at, 'archive', 'mbta_archive'
     FROM jsonb_to_recordset($1::jsonb) AS r(alert_id text, facility_id text, kind text, station_id text,
          station_name text, lines jsonb, header text, cause text, started_at timestamptz,
          first_seen_at timestamptz, resolved_at timestamptz)
     ON CONFLICT (alert_id) DO UPDATE
       SET resolved_at = EXCLUDED.resolved_at, resolved_source = 'mbta_archive'
       WHERE outages.resolved_at IS NOT NULL AND outages.resolved_source IS DISTINCT FROM 'mbta_archive'`,
    [JSON.stringify(rows.slice(i, i + 2000))],
  );
  inserted += result.rowCount;
}
const [{ total, unknown }] = (
  await client.query("select count(*) total, count(*) filter (where station_name = 'Unknown station' or station_name = '') unknown from outages")
).rows;
console.log(`inserted or corrected ${inserted} of ${rows.length}; outages table now has ${total} rows, ${unknown} without a station name`);
await client.end();
