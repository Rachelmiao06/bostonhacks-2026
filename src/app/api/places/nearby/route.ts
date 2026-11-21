// GET /api/places/nearby?stationId=place-xxxx
// Real cafés, bakeries and restaurants near an MBTA station, from Google Places API (New). The station is the search
// centre: only its public coordinates leave this server, never a rider's own location.
// The key stays here (GOOGLE_PLACES_API_KEY). Nothing is cached or stored: Google's terms do not allow it.
// Cost: each call is one Nearby Search request on Google's "Pro" tier (the field mask below stays within it),
// so keep a billing budget and quota cap on the key. A place listing is NOT an offer; see src/lib/places.ts.
import type { NextRequest } from "next/server";
import { findStation, mapNearby, type NearbyResult } from "@/lib/places";

const RADIUS_M = 800;
const FIELDS = [
  "places.id",
  "places.displayName",
  "places.shortFormattedAddress",
  "places.location",
  "places.primaryType",
  "places.primaryTypeDisplayName",
  "places.googleMapsUri",
  "places.photos",
].join(",");

function bad(error: string, status: number) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const station = findStation(request.nextUrl.searchParams.get("stationId"));
  if (!station) return bad("unknown_station", 400);
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return bad("not_configured", 503);

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELDS },
      body: JSON.stringify({
        includedPrimaryTypes: ["cafe", "coffee_shop", "bakery", "restaurant"],
        maxResultCount: 12,
        rankPreference: "DISTANCE",
        languageCode: "en",
        locationRestriction: { circle: { center: { latitude: station.lat, longitude: station.lon }, radius: RADIUS_M } },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return bad("lookup_failed", 502);
    const places = mapNearby(await res.json(), station);
    const body: NearbyResult = { station: { id: station.id, name: station.name }, places };
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return bad("lookup_failed", 502);
  }
}
