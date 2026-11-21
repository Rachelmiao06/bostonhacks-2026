import { cacheLife } from "next/cache";
import snapshot from "@/features/explore/subway-snapshot.json";
import type { SubwayData, SubwayLine, SubwayStation } from "@/features/explore/types";

// Subway lines, stations and track shapes from the MBTA V3 API (no key needed).
// Cached for a day; falls back to a saved snapshot so the demo never depends on live data.

const API = "https://api-v3.mbta.com";

type Resource = {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, { data: { id: string } | null }>;
};
type Doc = { data: Resource[]; included?: Resource[] };

async function mbta(path: string): Promise<Doc> {
  // Works without a key (20 requests a minute). MBTA_API_KEY in Vercel raises that to 1,000.
  const key = process.env.MBTA_API_KEY;
  const res = await fetch(`${API}${path}`, {
    headers: { accept: "application/vnd.api+json", ...(key ? { "x-api-key": key } : {}) },
  });
  if (!res.ok) throw new Error(`MBTA ${res.status} for ${path}`);
  return res.json();
}

/** Green-B, Green-C, Green-D and Green-E count as one line. */
const lineIdOf = (routeId: string) => routeId.split("-")[0];

async function loadSubway(): Promise<SubwayData> {
  "use cache";
  cacheLife("days");

  // Route types 0 and 1 are light rail and heavy rail: the subway.
  const routes = (await mbta("/routes?filter[type]=0,1&fields[route]=color,long_name")).data;
  const routeIds = routes.map((r) => r.id);
  // One stops request per line (the four Green branches share one) keeps us well under the MBTA limit.
  const lineIds = [...new Set(routeIds.map(lineIdOf))];

  const [patterns, ...stopsPerLine] = await Promise.all([
    mbta(
      `/route_patterns?filter[route]=${routeIds.join(",")}&filter[canonical]=true` +
        "&include=representative_trip.shape&fields[route_pattern]=direction_id,typicality" +
        "&fields[trip]=headsign&fields[shape]=polyline",
    ),
    ...lineIds.map((lineId) =>
      mbta(
        `/stops?filter[route]=${routeIds.filter((id) => lineIdOf(id) === lineId).join(",")}` +
          "&fields[stop]=name,latitude,longitude",
      ),
    ),
  ]);

  const lines = new Map<string, SubwayLine>();
  const stations = new Map<string, SubwayStation>();

  lineIds.forEach((id, i) => {
    const route = routes.find((r) => lineIdOf(r.id) === id)!;
    lines.set(id, {
      id,
      name: String(route.attributes.long_name).replace(/ [A-Z]$/, ""),
      color: `#${route.attributes.color}`,
      stationCount: 0,
    });
    for (const stop of stopsPerLine[i].data) {
      const station = stations.get(stop.id) ?? {
        id: stop.id,
        name: String(stop.attributes.name),
        longitude: Number(stop.attributes.longitude),
        latitude: Number(stop.attributes.latitude),
        lineIds: [],
      };
      if (!station.lineIds.includes(id)) station.lineIds.push(id);
      stations.set(stop.id, station);
    }
  });

  for (const line of lines.values()) {
    line.stationCount = [...stations.values()].filter((s) => s.lineIds.includes(line.id)).length;
  }

  // One shape per regular pattern, outbound direction only (inbound is the same track).
  const included = new Map((patterns.included ?? []).map((r) => [`${r.type}:${r.id}`, r]));
  const shapes = patterns.data
    .filter((p) => p.attributes.typicality === 1 && p.attributes.direction_id === 0)
    .flatMap((p) => {
      const trip = included.get(`trip:${p.relationships?.representative_trip?.data?.id}`);
      const shape = included.get(`shape:${trip?.relationships?.shape?.data?.id}`);
      const routeId = p.relationships?.route?.data?.id;
      if (!shape || !routeId) return [];
      return [{ lineId: lineIdOf(routeId), polyline: String(shape.attributes.polyline) }];
    });

  if (stations.size === 0 || shapes.length === 0) throw new Error("MBTA returned no subway data");

  return { source: "live", lines: [...lines.values()], stations: [...stations.values()], shapes };
}

export async function GET() {
  try {
    return Response.json(await loadSubway());
  } catch (error) {
    console.error("Subway data: using snapshot.", error);
    return Response.json({ ...(snapshot as SubwayData), source: "snapshot" });
  }
}
