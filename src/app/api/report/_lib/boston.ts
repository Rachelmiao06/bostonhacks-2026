// Boston's open 311 data (Analyze Boston, CKAN datastore). Server only. No key needed.
import { CATEGORY_NAMES } from "@/features/report/categories";
import type { CityStatus, NearbyCase } from "@/features/report/types";

const RESOURCE = "254adca6-64ab-4c5c-9fc0-a6da622be185"; // "311 Service Requests - NEW SYSTEM"
const SQL_URL = "https://data.boston.gov/api/3/action/datastore_search_sql";
export const MAX_ACCURACY_M = 50;
export const NEARBY_RADIUS_M = 50;

/** A rough box around Boston. It is a cheap first filter; the city's own data decides the rest. */
export const inBoston = (lat: number, lng: number) => lat >= 42.2279 && lat <= 42.3997 && lng >= -71.1912 && lng <= -70.986;

export class DataError extends Error {}

async function sql<T>(query: string): Promise<T[]> {
  let res: Response;
  try {
    res = await fetch(`${SQL_URL}?${new URLSearchParams({ sql: query })}`, { signal: AbortSignal.timeout(10_000), cache: "no-store" });
  } catch {
    throw new DataError("Could not reach Boston's 311 data");
  }
  if (!res.ok) throw new DataError(`Boston's 311 data answered ${res.status}`);
  const body = (await res.json()) as { success?: boolean; result?: { records?: T[] } };
  if (!body.success || !body.result?.records) throw new DataError("Boston's 311 data gave an unexpected answer");
  return body.result.records;
}

function metres(lat1: number, lng1: number, lat2: number, lng2: number) {
  const r = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2 - lng1) / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

/** Open cases of the same category within about 50 m. Same place + same category = probably the same problem. */
export async function nearbyOpenCases(lat: number, lng: number, serviceName: string): Promise<NearbyCase[]> {
  if (!CATEGORY_NAMES.includes(serviceName)) return [];
  const dLat = 0.0006; // a little over 60 m, then trimmed by real distance below
  const dLng = 0.0008;
  const rows = await sql<Record<string, string | null>>(
    `SELECT case_id, service_name, assigned_team, case_status, open_date, latitude, longitude FROM "${RESOURCE}" ` +
      `WHERE case_status <> 'Closed' AND service_name = '${serviceName.replace(/'/g, "''")}' ` +
      `AND CAST(latitude AS float) BETWEEN ${lat - dLat} AND ${lat + dLat} AND CAST(longitude AS float) BETWEEN ${lng - dLng} AND ${lng + dLng} ` +
      `ORDER BY open_date DESC LIMIT 25`,
  );
  return rows
    .map((r) => ({
      caseId: r.case_id ?? "",
      serviceName: r.service_name ?? serviceName,
      team: r.assigned_team,
      status: r.case_status ?? "",
      openedAt: r.open_date,
      distanceM: Math.round(metres(lat, lng, Number(r.latitude), Number(r.longitude))),
    }))
    .filter((c) => c.caseId && c.distanceM <= NEARBY_RADIUS_M)
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, 5);
}

const CASE_ID = /^BCS-\d{6,10}$/;

/** Live status of real 311 cases by id. Unknown ids are simply missing from the answer. */
export async function statusFor(ids: string[]): Promise<CityStatus[]> {
  const clean = ids.filter((i) => CASE_ID.test(i)).slice(0, 20);
  if (!clean.length) return [];
  const rows = await sql<Record<string, string | null>>(
    `SELECT case_id, case_status, assigned_team, service_name, open_date, close_date, closure_reason, closure_comments FROM "${RESOURCE}" ` +
      `WHERE case_id IN (${clean.map((i) => `'${i}'`).join(",")})`,
  );
  return rows.map((r) => ({
    caseId: r.case_id ?? "",
    status: r.case_status ?? "",
    team: r.assigned_team,
    serviceName: r.service_name,
    openedAt: r.open_date,
    closedAt: r.close_date,
    closureReason: r.closure_reason,
    closureComment: r.closure_comments,
  }));
}
