// Builds src/lib/data/nearby-places.json: real cafés, bakeries and restaurants near every MBTA station,
// from OpenStreetMap through the public Overpass API. No key, no account.
//
// Why a snapshot and not a live call: the public Overpass server is shared and can take 30+ seconds, and OpenStreetMap
// data is open (ODbL), so unlike Google's it MAY be stored, as long as it is credited ("© OpenStreetMap contributors").
// The ticket shows that credit. Businesses open and close, so the file records when it was built; re-run to refresh.
//
// Run:  node scripts/build-nearby-places.mjs
// Be kind to the public server: this makes a handful of requests with pauses, and retries politely.
import { readFileSync, writeFileSync } from "node:fs";

const RADIUS_M = 800;
const KEEP_PER_STATION = 24;
const ENDPOINT = "https://overpass-api.de/api/interpreter";
const UA = "TadaApp/1.0 (hackathon prototype; builds a static snapshot)";

const stationsFile = new URL("../src/lib/data/stations.json", import.meta.url);
const outFile = new URL("../src/lib/data/nearby-places.json", import.meta.url);
const stations = JSON.parse(readFileSync(stationsFile, "utf8")).stations;

const rad = (d) => (d * Math.PI) / 180;
const metres = (lat1, lon1, lat2, lon2) => {
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
};

// the area the stations cover, cut into tiles so no single request is huge
const pad = 0.012;
const lats = stations.map((s) => s.lat);
const lons = stations.map((s) => s.lon);
const S = Math.min(...lats) - pad;
const N = Math.max(...lats) + pad;
const W = Math.min(...lons) - pad;
const E = Math.max(...lons) + pad;
const ROWS = 3;
const COLS = 3;
const tiles = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) tiles.push([S + ((N - S) * r) / ROWS, W + ((E - W) * c) / COLS, S + ((N - S) * (r + 1)) / ROWS, W + ((E - W) * (c + 1)) / COLS]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchTile([s, w, n, e], attempt = 1) {
  const q = `[out:json][timeout:120];(nwr["amenity"~"^(cafe|restaurant|fast_food|bakery|ice_cream)$"]["name"](${s},${w},${n},${e});nwr["shop"="bakery"]["name"](${s},${w},${n},${e}););out center tags;`;
  try {
    const res = await fetch(ENDPOINT, { method: "POST", headers: { "User-Agent": UA, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" }, body: "data=" + encodeURIComponent(q), signal: AbortSignal.timeout(170000) });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return (await res.json()).elements ?? [];
  } catch (err) {
    if (attempt >= 4) throw err;
    console.log(`  tile failed (${err.message}); retrying in ${attempt * 30}s`);
    await sleep(attempt * 30000);
    return fetchTile([s, w, n, e], attempt + 1);
  }
}

const seen = new Map();
for (const [i, tile] of tiles.entries()) {
  console.log(`tile ${i + 1}/${tiles.length}`);
  for (const el of await fetchTile(tile)) seen.set(`${el.type}/${el.id}`, el);
  await sleep(5000);
}
console.log(`${seen.size} named food places in the area`);

const kindOf = (t) => (t.shop === "bakery" || t.amenity === "bakery" ? "bakery" : t.amenity === "cafe" ? "cafe" : t.amenity === "restaurant" || t.amenity === "fast_food" ? "restaurant" : "other");
const categoryOf = (t, kind) => {
  if (kind === "cafe") return t.cuisine === "coffee_shop" || /coffee/i.test(t.cuisine ?? "") ? "Coffee shop" : "Café";
  if (kind === "bakery") return "Bakery";
  if (t.amenity === "ice_cream") return "Ice cream";
  if (t.amenity === "fast_food") return "Fast food";
  const c = (t.cuisine ?? "").split(";")[0].replace(/_/g, " ").trim();
  return c ? `${c[0].toUpperCase()}${c.slice(1)} restaurant` : "Restaurant";
};
const areaOf = (t) => [[t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" "), t["addr:suburb"] ?? t["addr:neighbourhood"]].filter(Boolean).join(", ");

const places = [...seen.values()]
  .map((el) => {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    const t = el.tags ?? {};
    if (typeof lat !== "number" || typeof lon !== "number" || !t.name) return null;
    const kind = kindOf(t);
    return { id: `${el.type}/${el.id}`, name: t.name, kind, category: categoryOf(t, kind), area: areaOf(t), lat, lon, local: !t.brand && !t["brand:wikidata"] };
  })
  .filter(Boolean);

const byStation = {};
for (const st of stations) {
  byStation[st.id] = places
    .map((p) => ({ p, d: metres(st.lat, st.lon, p.lat, p.lon) }))
    .filter((x) => x.d <= RADIUS_M)
    .sort((a, b) => a.d - b.d)
    .slice(0, KEEP_PER_STATION)
    .map((x) => ({ ...x.p, lat: +x.p.lat.toFixed(6), lon: +x.p.lon.toFixed(6) }));
}

const withPlaces = Object.values(byStation).filter((l) => l.length).length;
writeFileSync(outFile, JSON.stringify({ source: "OpenStreetMap contributors (ODbL), via the Overpass API", license: "https://www.openstreetmap.org/copyright", builtAt: new Date().toISOString().slice(0, 10), radiusM: RADIUS_M, stations: byStation }));
console.log(`wrote ${outFile.pathname}: ${withPlaces}/${stations.length} stations have places`);
