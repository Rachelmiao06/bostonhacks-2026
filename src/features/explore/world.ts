// The "small world": one stop and the few blocks around it, as a 3D model you drop into.
// Pure helpers only (no React): district maths, the 3D building layer, the GSAP camera flight.
import gsap from "gsap";
import type { FilterSpecification, Map as MapLibreMap } from "maplibre-gl";
import { tokenColor } from "@/lib/map";
import type { ProblemStop } from "./quests";
import type { SubwayStation } from "./types";

export type LngLat = [number, number];

/** How the rider chose to start. "pending" = still on the gate. */
export type Entry = { kind: "pending" } | { kind: "geo"; lat: number; lng: number } | { kind: "spot"; stationId: string } | { kind: "atlas" };

export type World = {
  station: SubwayStation;
  center: LngLat;
  /** The rider's own position, only when it falls inside the district. Never stored or sent anywhere. */
  you: LngLat | null;
  note: { kind: "far" } | { kind: "quiet"; from: string } | null;
};

/** The district is a circle this wide around the stop. */
export const WORLD_RADIUS_M = 800;
/** Further from every stop than this, we do not pretend the rider is in Boston. */
const NEAR_LIMIT_M = 6000;
const FALLBACK_STATION = "place-pktrm";

export type CameraView = {
  center: LngLat;
  zoom: number;
  pitch: number;
  bearing: number;
};

/** Greater Boston from high above: where every dive starts. On phones Boston sits higher, clear of the card below. */
export function overviewView(phone: boolean): CameraView {
  return { center: [-71.071, phone ? 42.331 : 42.341], zoom: phone ? 11.8 : 12.6, pitch: 0, bearing: 0 };
}

export function worldView(center: LngLat, phone: boolean): CameraView {
  return { center, zoom: phone ? 15.6 : 16.1, pitch: 62, bearing: -28 };
}

export function distanceM(a: LngLat, b: LngLat): number {
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad;
  const dLng = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

const at = (s: SubwayStation): LngLat => [s.longitude, s.latitude];

function nearestBy<T>(items: T[], metres: (item: T) => number): { item: T; metres: number } | null {
  let best: { item: T; metres: number } | null = null;
  for (const item of items) {
    const m = metres(item);
    if (!best || m < best.metres) best = { item, metres: m };
  }
  return best;
}

/**
 * Picks the stop the world is built around.
 * Rider location: the nearest stop. If nothing is broken within the district, the world moves to the
 * closest stop that has a problem, so there is always something to do. Too far from the T: Park Street.
 */
export function chooseWorld(entry: Exclude<Entry, { kind: "pending" } | { kind: "atlas" }>, stations: SubwayStation[], stops: ProblemStop[]): World {
  const byId = (id: string) => stations.find((s) => s.id === id);
  let you: LngLat | null = null;
  let found: SubwayStation | undefined;
  let note: World["note"] = null;

  if (entry.kind === "spot") {
    found = byId(entry.stationId);
  } else {
    you = [entry.lng, entry.lat];
    const near = nearestBy(stations, (s) => distanceM(you!, at(s)));
    if (near && near.metres <= NEAR_LIMIT_M) {
      found = near.item;
    } else {
      found = byId(FALLBACK_STATION);
      note = { kind: "far" };
      you = null;
    }
  }
  let station = found ?? stations[0];

  const hasProblemNearby = stops.some((s) => distanceM(at(station), at(s.station)) <= WORLD_RADIUS_M);
  if (!hasProblemNearby && stops.length) {
    const from = you ?? at(station);
    const closest = nearestBy(stops, (s) => distanceM(from, at(s.station)));
    if (closest) {
      if (!note) note = { kind: "quiet", from: station.name };
      station = closest.item.station;
    }
  }

  const center = at(station);
  return {
    station,
    center,
    you: you && distanceM(you, center) <= WORLD_RADIUS_M ? you : null,
    note,
  };
}

export function insideWorld(center: LngLat, point: LngLat, factor = 1) {
  return distanceM(center, point) <= WORLD_RADIUS_M * factor;
}

// ---------- 3D buildings ----------

// Three stacked extrusions make a small painted model: a soft ground shadow, the coloured walls,
// and a lighter roof cap on top. All three share one footprint filter and fade together.
const SHADOW = "world-buildings-shadow";
const BUILDINGS = "world-buildings";
const ROOFS = "world-buildings-roofs";
const BUILDING_LAYERS = [SHADOW, BUILDINGS, ROOFS] as const;
/** The shadow stays fainter than the buildings however visible they are. */
const SHADOW_SHARE = 0.4;
/** How thick the roof cap is, in metres. */
const ROOF_M = 2.4;

/** Mixes two CSS colours (as the map needs them: rgb) by `t` (0 = a, 1 = b). */
function mix(a: string, b: string, t: number): string {
  const rgb = (css: string) => (css.match(/[\d.]+/g) ?? ["0", "0", "0"]).slice(0, 3).map(Number);
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  const channel = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${channel(ar, br)},${channel(ag, bg)},${channel(ab, bb)})`;
}

/**
 * Walls and roofs in the app's own colours (the `--cherry`, `--sun`, `--sky`, `--leaf`, `--wood` tokens),
 * softened with cream paper so the blocks look like painted wood. Index = the building's colour group.
 */
function buildingPalette() {
  const paper = tokenColor("--paper");
  const ivory = tokenColor("--ivory");
  const walls = [
    mix(tokenColor("--cherry"), paper, 0.42), // blush brick
    mix(tokenColor("--sun"), paper, 0.36), // butter
    mix(tokenColor("--sky"), paper, 0.4), // powder blue
    mix(tokenColor("--leaf"), paper, 0.45), // mint
    mix(tokenColor("--wood"), paper, 0.38), // clay
  ];
  const tall = mix(tokenColor("--steel"), tokenColor("--sky"), 0.3);
  return {
    walls,
    roofs: walls.map((wall) => mix(wall, ivory, 0.42)),
    tall,
    tallRoof: mix(tall, ivory, 0.5),
    shadow: tokenColor("--graphite"),
  };
}

/**
 * Raises the real buildings of the district into 3D. Only inside the circle (a few hundred buildings),
 * so the rest of the city stays flat and light.
 */
export function showWorldBuildings(map: MapLibreMap, center: LngLat) {
  // `within` does not work on building outlines in MapLibre; `distance` does, and gives us the circle.
  const filter = ["<=", ["distance", { type: "Point", coordinates: center }], WORLD_RADIUS_M * 1.05] as unknown as FilterSpecification;
  if (map.getLayer(BUILDINGS)) {
    for (const id of BUILDING_LAYERS) map.setFilter(id, filter);
    return;
  }

  // Warm afternoon sun from the south-west: lit walls glow, the others sit in cool shade.
  map.setLight({ anchor: "viewport", color: tokenColor("--ivory"), intensity: 0.9, position: [1.6, 235, 30] });

  const palette = buildingPalette();
  const rawHeight: unknown = ["coalesce", ["get", "render_height"], 9];
  // Capped so a tower never hides the stop behind it; a diorama, not a skyline.
  const height: unknown = ["min", 40, ["max", 6, rawHeight]];
  const base: unknown = ["coalesce", ["get", "render_min_height"], 0];
  const isTall: unknown = [">", rawHeight, 34];
  // The tiles' feature ids are no help (nearly all the same), so the height picks one of five colours:
  // neighbours of different heights differ, and a row of identical houses stays one colour, like a painted street.
  const group: unknown = ["%", ["floor", ["*", rawHeight, 3.7]], 5];
  const pick = (colours: string[], tallColour: string): unknown => [
    "case",
    isTall,
    tallColour,
    ["match", group, 0, colours[0], 1, colours[1], 2, colours[2], 3, colours[3], colours[4]],
  ];
  const roofTop: unknown = ["max", ["+", base, 1], ["-", height, ROOF_M]];

  // Under every label and the T lines, so street names, stop names and routes always read on top of the buildings.
  const beforeId = map.getStyle().layers.find((layer) => layer.type === "symbol")?.id;
  const common = { type: "fill-extrusion" as const, source: "openmaptiles", "source-layer": "building", minzoom: 14, filter };

  map.addLayer(
    {
      ...common,
      id: SHADOW,
      paint: {
        // A flat copy slid to the north-east: the soft pool of shade each block throws on the street.
        "fill-extrusion-height": 0.2,
        "fill-extrusion-base": 0,
        "fill-extrusion-color": palette.shadow,
        "fill-extrusion-opacity": 0,
        "fill-extrusion-translate": [12, -12],
        "fill-extrusion-translate-anchor": "map",
        "fill-extrusion-vertical-gradient": false,
      },
    },
    beforeId,
  );
  map.addLayer(
    {
      ...common,
      id: BUILDINGS,
      paint: {
        "fill-extrusion-height": roofTop as never,
        "fill-extrusion-base": base as never,
        "fill-extrusion-color": pick(palette.walls, palette.tall) as never,
        "fill-extrusion-opacity": 0,
        "fill-extrusion-vertical-gradient": true,
      },
    },
    beforeId,
  );
  map.addLayer(
    {
      ...common,
      id: ROOFS,
      paint: {
        "fill-extrusion-height": height as never,
        "fill-extrusion-base": roofTop as never,
        "fill-extrusion-color": pick(palette.roofs, palette.tallRoof) as never,
        "fill-extrusion-opacity": 0,
        "fill-extrusion-vertical-gradient": false,
      },
    },
    beforeId,
  );
}

export function setWorldBuildingsOpacity(map: MapLibreMap, opacity: number) {
  for (const id of BUILDING_LAYERS) {
    if (map.getLayer(id)) map.setPaintProperty(id, "fill-extrusion-opacity", id === SHADOW ? opacity * SHADOW_SHARE : opacity);
  }
}

// ---------- camera ----------

const zoomEase = gsap.parseEase("power3.inOut");
const tiltEase = gsap.parseEase("power2.in");

/** Where the camera is when the flight is `e` of the way from the high view (0) to the low one (1). */
function pathAt(high: CameraView, low: CameraView, e: number): CameraView {
  const zoom = high.zoom + (low.zoom - high.zoom) * e;
  // The stop stays near the middle of the screen the whole way down: the gap to it shrinks as we zoom.
  const gap = 2 ** (high.zoom - zoom) * (1 - e);
  const tilt = tiltEase(e);
  return {
    zoom,
    center: [low.center[0] + (high.center[0] - low.center[0]) * gap, low.center[1] + (high.center[1] - low.center[1]) * gap],
    pitch: high.pitch + (low.pitch - high.pitch) * tilt,
    bearing: high.bearing + (low.bearing - high.bearing) * tilt,
  };
}

type FlightOptions = {
  duration: number;
  /** Reduced Motion: arrive at once. */
  instant: boolean;
  /** Extra beats on the same timeline (the fog closing in, the buildings rising). */
  decorate?: (timeline: gsap.core.Timeline) => void;
  onComplete?: () => void;
};

/**
 * Flies the camera with GSAP so the rest of the screen can move in time with it.
 * Works down (zoom in) and up (zoom out). Any touch, click or scroll on the map finishes the flight at once.
 */
export function flyCamera(map: MapLibreMap, to: CameraView, { duration, instant, decorate, onComplete }: FlightOptions): gsap.core.Timeline {
  const from: CameraView = {
    center: [map.getCenter().lng, map.getCenter().lat],
    zoom: map.getZoom(),
    pitch: map.getPitch(),
    bearing: map.getBearing(),
  };
  const zoomingIn = to.zoom >= from.zoom;
  const [high, low] = zoomingIn ? [from, to] : [to, from];

  // Room left for a card or panel eases away during the flight, so nothing jumps.
  const padFrom = map.getPadding();
  const frame = (t: number) => {
    const e = zoomEase(t);
    const view = pathAt(high, low, zoomingIn ? e : 1 - e);
    const keep = 1 - e;
    map.jumpTo({
      center: view.center,
      zoom: view.zoom,
      pitch: view.pitch,
      bearing: view.bearing,
      padding: {
        top: (padFrom.top ?? 0) * keep,
        bottom: (padFrom.bottom ?? 0) * keep,
        left: (padFrom.left ?? 0) * keep,
        right: (padFrom.right ?? 0) * keep,
      },
    });
  };

  const progress = { t: 0 };
  const timeline = gsap.timeline();
  timeline.to(
    progress,
    {
      t: 1,
      duration: instant ? 0.001 : duration,
      ease: "none",
      onUpdate: () => frame(progress.t),
    },
    0,
  );
  if (!instant) decorate?.(timeline);

  // Someone grabbing the map takes over: finish the flight right now.
  const box = map.getCanvasContainer();
  const stop = () => timeline.progress(1, false);
  const events = ["pointerdown", "wheel", "touchstart"] as const;
  events.forEach((name) => box.addEventListener(name, stop, { once: true, passive: true }));
  timeline.eventCallback("onComplete", () => {
    events.forEach((name) => box.removeEventListener(name, stop));
    onComplete?.();
  });
  return timeline;
}

/**
 * Keeps the rider inside the district. Let go of the map too far out and it eases back, like a game leash.
 * Returns the function that removes it.
 */
export function leash(map: MapLibreMap, center: LngLat): () => void {
  const pullBack = () => {
    const now = map.getCenter();
    if (distanceM(center, [now.lng, now.lat]) > WORLD_RADIUS_M * 0.85) map.easeTo({ center, duration: 800 });
  };
  map.on("moveend", pullBack);
  return () => {
    map.off("moveend", pullBack);
  };
}

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
