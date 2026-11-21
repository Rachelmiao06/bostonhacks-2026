// Nearby places for the gifts in My World: types and the pure mapping from Google's Places API (New) response.
// No keys here (the API routes under src/app/api/places hold the key and make the calls).
//
// What is REAL: the business name, category, address, distance (computed here from real coordinates), the Google Maps
// link and the photo (with its author credit), all from Google Places. What is NOT: any offer, discount or partnership.
// A place listing is never proof that the business agreed to a promotion, so a place has no offer fields at all.
//
// Google's terms, in short (check the live policy before changing this): place content may not be pre-fetched, cached
// or stored (only the place ID may be kept), photos need their author attribution, and Places data must not be drawn
// on a non-Google map (we only link out to Google Maps). So nothing here is cached or stored.
import stationData from "./data/stations.json";

export type PlaceKind = "cafe" | "bakery" | "restaurant" | "other";

export type NearbyPlace = {
  /** Google's place id (the one thing Google allows storing). */
  id: string;
  name: string;
  /** e.g. "Coffee shop", "Bakery". Google's own display name for the primary type. */
  category: string;
  kind: PlaceKind;
  /** Short address or neighbourhood as Google gives it. */
  area: string;
  /** Metres from the station, computed from both real coordinates; null if either is missing. */
  distanceM: number | null;
  /** Opens this place in Google Maps. */
  mapsUri: string;
  /** Resource name for the photo proxy, and who took it. Null when the place has no photo. */
  photo: { name: string; credit: string } | null;
};

export type NearbyResult = { station: { id: string; name: string }; places: NearbyPlace[] };

export type Station = { id: string; name: string; lat: number; lon: number };

const stations = (stationData as { stations: Station[] }).stations;

export function findStation(id: string | null | undefined): Station | null {
  if (!id) return null;
  return stations.find((s) => s.id === id) ?? null;
}

/** Great-circle distance in metres. */
export function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** "0.3 mi" or "250 ft"; null if the distance is unknown. */
export function formatDistance(m: number | null): string | null {
  if (m === null) return null;
  const miles = m / 1609.344;
  return miles < 0.1 ? `${Math.max(10, Math.round((m * 3.28084) / 10) * 10)} ft` : `${miles.toFixed(1)} mi`;
}

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  shortFormattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  primaryType?: string;
  primaryTypeDisplayName?: { text?: string };
  googleMapsUri?: string;
  photos?: { name?: string; authorAttributions?: { displayName?: string }[] }[];
};

const kindOf = (primaryType: string | undefined): PlaceKind =>
  primaryType === "bakery" ? "bakery" : primaryType === "cafe" || primaryType === "coffee_shop" ? "cafe" : primaryType?.endsWith("restaurant") ? "restaurant" : "other";

/**
 * Turns Google's searchNearby response into at most `limit` places for the gifts: first a café, then a bakery,
 * then a restaurant if there are any (so the three gifts are different discoveries), then the nearest of the rest.
 * Entries without a name, id or Maps link are dropped: nothing is invented to fill a gap.
 */
export function mapNearby(json: { places?: GooglePlace[] }, center: { lat: number; lon: number }, limit = 3): NearbyPlace[] {
  const all: NearbyPlace[] = [];
  for (const p of json.places ?? []) {
    const name = p.displayName?.text?.trim();
    if (!p.id || !name || !p.googleMapsUri) continue;
    const lat = p.location?.latitude;
    const lon = p.location?.longitude;
    const photo = p.photos?.[0];
    all.push({
      id: p.id,
      name,
      category: p.primaryTypeDisplayName?.text ?? "Place to eat",
      kind: kindOf(p.primaryType),
      area: p.shortFormattedAddress ?? "",
      distanceM: typeof lat === "number" && typeof lon === "number" ? Math.round(haversineM(center.lat, center.lon, lat, lon)) : null,
      mapsUri: p.googleMapsUri,
      photo: photo?.name ? { name: photo.name, credit: photo.authorAttributions?.map((a) => a.displayName).filter(Boolean).join(", ") || "Google Maps contributor" } : null,
    });
  }
  all.sort((a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity));
  const picked: NearbyPlace[] = [];
  for (const kind of ["cafe", "bakery", "restaurant"] as const) {
    const hit = all.find((p) => p.kind === kind && !picked.includes(p));
    if (hit) picked.push(hit);
  }
  for (const p of all) if (picked.length < limit && !picked.includes(p)) picked.push(p);
  return picked.slice(0, limit);
}
