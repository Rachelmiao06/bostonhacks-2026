import { cacheLife } from "next/cache";
import { connection } from "next/server";
import snapshot from "@/features/explore/live-snapshot.json";
import type { LiveData } from "@/features/explore/types";

// Where the trains are right now, and which station elevators are out (MBTA V3 API, no key needed).
// Shared between all visitors for 15 seconds so we stay far below the MBTA's request limit.
// Falls back to a saved sample so the demo never depends on live data.

const API = "https://api-v3.mbta.com";

type Resource = {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, { data: { id: string } | { id: string }[] | null }>;
};
type Doc = { data: Resource[]; included?: Resource[] };

async function mbta(path: string): Promise<Doc> {
  const key = process.env.MBTA_API_KEY;
  const res = await fetch(`${API}${path}`, {
    headers: { accept: "application/vnd.api+json", ...(key ? { "x-api-key": key } : {}) },
  });
  if (!res.ok) throw new Error(`MBTA ${res.status} for ${path}`);
  return res.json();
}

const one = (rel?: { data: { id: string } | { id: string }[] | null }) =>
  rel?.data && !Array.isArray(rel.data) ? rel.data.id : undefined;

async function loadLive(): Promise<LiveData> {
  "use cache";
  cacheLife({ stale: 15, revalidate: 15, expire: 60 });

  const [vehicles, alerts] = await Promise.all([
    mbta("/vehicles?filter[route_type]=0,1&fields[vehicle]=latitude,longitude"),
    mbta(
      "/alerts?filter[route_type]=0,1&filter[activity]=USING_WHEELCHAIR&include=facilities" +
        "&fields[alert]=effect,header&fields[facility]=short_name",
    ),
  ]);

  const trains = vehicles.data.flatMap((v) => {
    const routeId = one(v.relationships?.route);
    const { latitude, longitude } = v.attributes;
    if (!routeId || typeof latitude !== "number" || typeof longitude !== "number") return [];
    // Green-B, Green-C, Green-D and Green-E count as one line, same as /api/subway.
    return [{ id: v.id, lineId: routeId.split("-")[0], longitude, latitude }];
  });

  // An alert names a facility (the elevator); the facility names its station.
  const stationOf = new Map(
    (alerts.included ?? []).map((facility) => [facility.id, one(facility.relationships?.stop)]),
  );
  const seen = new Set<string>();
  const outages = alerts.data
    .filter((alert) => alert.attributes.effect === "ELEVATOR_CLOSURE")
    .flatMap((alert) => {
      const facilities = alert.relationships?.facilities?.data;
      return (Array.isArray(facilities) ? facilities : []).flatMap((facility) => {
        const stationId = stationOf.get(facility.id);
        const key = `${stationId}:${alert.id}`;
        if (!stationId || seen.has(key)) return [];
        seen.add(key);
        return [{ stationId, header: String(alert.attributes.header).trim() }];
      });
    });

  return { source: "live", trains, outages };
}

export async function GET() {
  // Live data is never built ahead of time: wait for a real request.
  await connection();
  try {
    return Response.json(await loadLive());
  } catch (error) {
    console.error("Live subway data: using saved sample.", error);
    return Response.json({ ...(snapshot as LiveData), source: "snapshot" });
  }
}
