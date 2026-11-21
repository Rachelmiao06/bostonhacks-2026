// GET /api/places/nearby?stationId=place-xxxx
// Real cafés, bakeries and restaurants near an MBTA station.
// Default (no key): the OpenStreetMap snapshot in src/lib/data/nearby-places.json (instant, free, credited, no photos).
// If GOOGLE_PLACES_API_KEY is set: live Google Places API (New), which adds a real photo. The station is the search
// centre: only its public coordinates ever leave this server, never a rider's own location. The key stays here.
// Nothing from Google is cached or stored (their terms). Cost: each Google call is one Nearby Search request on the
// "Pro" tier (the field mask below stays within it), so keep a billing budget and quota cap on the key.
// If Google fails, the snapshot answers instead. A place listing is NOT an offer; see src/lib/places.ts.
import type { NextRequest } from "next/server";
import { findStation, mapGoogle, mapSnapshot, type NearbyResult } from "@/lib/places";

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
  const respond = (source: NearbyResult["source"], places: NearbyResult["places"]) => {
    const body: NearbyResult = { station: { id: station.id, name: station.name }, source, places };
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  };

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (key) {
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
      if (res.ok) {
        const places = mapGoogle(await res.json(), station);
        if (places.length) return respond("google", places);
      }
    } catch {
      // fall through to the snapshot
    }
  }

  const places = mapSnapshot(station.id, station);
  return places.length ? respond("osm", places) : bad("no_places", 404);
}
