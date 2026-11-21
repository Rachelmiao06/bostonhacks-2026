// The database (Tiger Data = PostgreSQL + TimescaleDB). Server only: never import from a client component.
// Tables are defined in src/lib/data/schema.sql.
import { Pool, type QueryResultRow } from "pg";
import type { Quest } from "./mbta";

let pool: Pool | undefined;

export function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getPool(): Pool {
  if (!pool) {
    const raw = process.env.DATABASE_URL;
    if (!raw) throw new Error("DATABASE_URL is not set");
    // Tiger Data's certificate chain is self-signed; this keeps the connection encrypted
    // with standard `sslmode=require` behaviour.
    const url = new URL(raw);
    url.searchParams.set("uselibpqcompat", "true");
    pool = new Pool({ connectionString: url.toString(), max: 3 });
  }
  return pool;
}

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

/**
 * Saves the current live quests and detects fixes.
 * A fix = an outage we had open that is no longer in MBTA's feed.
 * Only call with a successful, non-empty LIVE feed: an empty list would mark everything fixed.
 */
export async function syncOutages(quests: Quest[], observedAt: string): Promise<{ resolved: number }> {
  if (quests.length === 0) return { resolved: 0 };
  const rows = JSON.stringify(
    quests.map((q) => ({
      alert_id: q.id,
      facility_id: q.facilityId,
      kind: q.kind,
      station_id: q.stationId,
      station_name: q.stationName,
      lines: q.lines,
      header: q.header,
      cause: q.cause,
      started_at: q.startedAt,
    })),
  );

  await query(
    `INSERT INTO outages (alert_id, facility_id, kind, station_id, station_name, lines, header, cause, started_at, first_seen_at, last_seen_at)
     SELECT r.alert_id, r.facility_id, r.kind, r.station_id, r.station_name,
            ARRAY(SELECT jsonb_array_elements_text(r.lines)), r.header, r.cause, r.started_at, $2, $2
     FROM jsonb_to_recordset($1::jsonb) AS r(alert_id text, facility_id text, kind text, station_id text,
          station_name text, lines jsonb, header text, cause text, started_at timestamptz)
     ON CONFLICT (alert_id) DO UPDATE
       SET last_seen_at = EXCLUDED.last_seen_at, header = EXCLUDED.header, cause = EXCLUDED.cause,
           resolved_at = NULL, resolved_source = NULL`,
    [rows, observedAt],
  );

  await query(
    `INSERT INTO outage_observations (observed_at, alert_id, facility_id, kind)
     SELECT $2, r.alert_id, r.facility_id, r.kind
     FROM jsonb_to_recordset($1::jsonb) AS r(alert_id text, facility_id text, kind text)
     ON CONFLICT DO NOTHING`,
    [rows, observedAt],
  );

  const resolved = await query(
    `UPDATE outages SET resolved_at = $2, resolved_source = 'detected'
     WHERE resolved_at IS NULL AND alert_id <> ALL($1::text[]) RETURNING alert_id`,
    [quests.map((q) => q.id), observedAt],
  );
  return { resolved: resolved.length };
}
