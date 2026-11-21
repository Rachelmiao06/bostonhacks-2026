// All map setup in one place: MapLibre GL through react-map-gl, free OpenFreeMap tiles.
// Browser only. Load any component that imports this with next/dynamic and ssr: false.
import "maplibre-gl/dist/maplibre-gl.css";
import { setWorkerUrl } from "maplibre-gl";
import type { GeoJSONSource, LayerSpecification, Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import type { LayerProps } from "react-map-gl/maplibre";

export { Layer, Map, Marker, NavigationControl, Source, useMap } from "react-map-gl/maplibre";
export type { MapRef } from "react-map-gl/maplibre";

// MapLibre 6 draws tiles in a web worker and looks for the worker file next to its own script.
// A bundler moves that script, so we hand it the worker file's real address.
setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);

/** OpenFreeMap "positron": free streets, no API key. We repaint it in our own tokens below. */
const BASE_STYLE = "https://tiles.openfreemap.org/styles/positron";

export const MAX_PITCH = 70;
export const MIN_ZOOM = 9.5;

/** Keeps the camera around Greater Boston: [west, south, east, north]. */
export const MAX_BOUNDS: [number, number, number, number] = [-71.65, 42.0, -70.6, 42.7];

export function initialView() {
  // Phones start zoomed out a little so the whole core of the T fits.
  const isPhone = window.innerWidth < 640;
  return { longitude: -71.0712, latitude: 42.3522, zoom: isPhone ? 11.4 : 12.3, pitch: 55, bearing: 0 };
}

/** Reads a colour token from globals.css (for example "--paper") as red, green, blue numbers. */
function tokenRgb(token: string): [number, number, number] {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx) return [0, 0, 0];
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

/**
 * A colour token as a colour the map can use.
 * The map cannot read CSS variables or oklch itself, so the browser converts it for us.
 */
export function tokenColor(token: string, alpha = 1): string {
  const [r, g, b] = tokenRgb(token);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** A solid blend of two tokens: 0 is all `from`, 1 is all `to`. */
function blend(from: string, to: string, amount: number): string {
  const a = tokenRgb(from);
  const b = tokenRgb(to);
  const mix = a.map((channel, i) => Math.round(channel + (b[i] - channel) * amount));
  return `rgb(${mix.join(",")})`;
}

/**
 * The one colour the whole base map is drawn in, on cream paper, and how strongly it is mixed in.
 * "--sun" at 0.17 gives a light, fresh cream (current); "--wood" at 0.4 a browner cream;
 * "--sky" at 1 light blue; "--cherry" at 0.6 pink; "--steel" at 0.8 grey.
 * Everything colourful (T lines, trains, markers, whatever we add next) goes on top.
 */
const BASE_TONE = "--sun";
const BASE_STRENGTH = 0.17;

/** Water gets its own soft blue, so a warm base does not turn rivers yellow or brown. */
const WATER_TONE = "--sky";

/** A shade of the base colour: 0 is plain paper, 1 is the base colour at full strength. */
const shade = (amount: number) => blend("--paper", BASE_TONE, amount * BASE_STRENGTH);

/**
 * Buildings as raised 3D blocks (true) or flat footprints (false).
 * Flat keeps the base calm, like an illustrated city map, so the 3D things we float on top stand out.
 */
const BUILDINGS_3D = false;

/**
 * The base map, in the manner of an illustrated city map: land is a soft block of one colour,
 * streets are the paper showing through, water is a deeper shade of the same colour.
 * Every colour comes from a token in globals.css, so a theme change restyles the map too.
 */
export async function loadMapStyle(): Promise<StyleSpecification> {
  const style: StyleSpecification = await fetch(BASE_STYLE).then((res) => res.json());
  const paper = tokenColor("--paper");
  const land = shade(0.4);
  const park = shade(0.22);
  const block = shade(0.58); // building footprints
  const water = blend("--paper", WATER_TONE, 0.4);
  const text = blend("--wood", "--ink", 0.5); // labels: the same colour, darkened so they stay readable

  style.layers = style.layers.flatMap((layer): LayerSpecification[] => {
    const sourceLayer = "source-layer" in layer ? layer["source-layer"] : undefined;

    if (layer.type === "background") return [{ ...layer, paint: { "background-color": land } }];

    if (layer.type === "fill") {
      if (sourceLayer === "water") return [{ ...layer, paint: { "fill-color": water } }];
      if (sourceLayer === "park") return [{ ...layer, paint: { "fill-color": park } }];
      if (sourceLayer === "building")
        return BUILDINGS_3D
          ? [
              {
                id: "building-3d",
                type: "fill-extrusion" as const,
                source: layer.source,
                "source-layer": "building",
                minzoom: 13,
                paint: {
                  "fill-extrusion-color": block,
                  "fill-extrusion-height": ["coalesce", ["get", "render_height"], 6],
                  "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
                  "fill-extrusion-opacity": 0.92,
                },
              },
            ]
          : [{ ...layer, minzoom: 13, paint: { "fill-color": block } }];
      // Land-use patches would only add noise.
      return [];
    }

    if (layer.type === "line") {
      if (sourceLayer === "boundary" || layer.id.endsWith("_casing") || layer.id.endsWith("dashline")) return [];
      if (sourceLayer === "waterway") return [{ ...layer, paint: { "line-color": water } }];
      // Streets are the paper showing through the coloured land.
      return [{ ...layer, paint: { ...layer.paint, "line-color": paper, "line-opacity": 1 } }];
    }

    if (layer.type === "symbol") {
      // Road-number shields are grey sprite images from the base style; leave them out.
      if (layer.id.includes("shield")) return [];
      return [{ ...layer, paint: { "text-color": text, "text-halo-color": paper, "text-halo-width": 1.5 } }];
    }

    return [layer];
  });

  // 3D buildings sit above the streets but below the labels: move them just before the first label.
  const buildings = style.layers.filter((layer) => layer.id === "building-3d");
  const rest = style.layers.filter((layer) => layer.id !== "building-3d");
  const firstLabel = rest.findIndex((layer) => layer.type === "symbol");
  rest.splice(firstLabel === -1 ? rest.length : firstLabel, 0, ...buildings);
  style.layers = rest;

  return style;
}

/**
 * Doodle look, part 1: water filled with crayon-style scribble strokes instead of a flat colour.
 * The little texture is drawn here in the base tone, then handed to the map. Call once the map has loaded.
 */
export function addDoodleTextures(map: MapLibreMap) {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || map.hasImage("scribble")) return;
  ctx.fillStyle = blend("--paper", WATER_TONE, 0.4);
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = blend("--paper", WATER_TONE, 0.75);
  ctx.lineCap = "round";
  // Slanted strokes of uneven weight, repeated past the edges so the tile joins up with itself.
  [0, 13, 29, 41, 54].forEach((offset, i) => {
    ctx.lineWidth = 1.2 + (i % 3) * 0.7;
    for (const shift of [-size, 0, size]) {
      ctx.beginPath();
      ctx.moveTo(offset + shift - 6, size + 6);
      ctx.lineTo(offset + shift + size + 6, -6);
      ctx.stroke();
    }
  });
  map.addImage("scribble", ctx.getImageData(0, 0, size, size));
  if (map.getLayer("water")) map.setPaintProperty("water", "fill-pattern", "scribble");
}

/**
 * Things drawn on top of the realistic base, sticker style. First one: hospitals, straight from
 * the map's own place data, each with a little hand-drawn cross badge. Call once the map has loaded.
 * Add more kinds (schools, parks, libraries) the same way: draw a badge, filter the "poi" layer by class.
 */
export function addStickerLayers(map: MapLibreMap) {
  if (map.getLayer("sticker-hospital")) return;
  const size = 56;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  // A slightly crooked paper square with an ink edge and a red cross.
  ctx.translate(size / 2, size / 2);
  ctx.rotate(-0.08);
  ctx.lineJoin = "round";
  ctx.lineWidth = 4;
  ctx.fillStyle = tokenColor("--paper");
  ctx.strokeStyle = tokenColor("--ink");
  ctx.beginPath();
  ctx.roundRect(-20, -20, 40, 40, 9);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = tokenColor("--cherry");
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(0, 10);
  ctx.moveTo(-10, 0);
  ctx.lineTo(10, 0);
  ctx.stroke();
  ctx.resetTransform();
  map.addImage("sticker-hospital", ctx.getImageData(0, 0, size, size), { pixelRatio: 2 });

  map.addLayer({
    id: "sticker-hospital",
    type: "symbol",
    source: "openmaptiles",
    "source-layer": "poi",
    filter: ["==", ["get", "class"], "hospital"],
    layout: {
      "icon-image": "sticker-hospital",
      "icon-size": ["interpolate", ["linear"], ["zoom"], 11, 0.7, 15, 1.2],
      "icon-allow-overlap": true,
      "text-field": ["step", ["zoom"], "", 13.5, ["get", "name"]],
      "text-font": ["Noto Sans Regular"],
      "text-size": 11,
      "text-offset": [0, 1.5],
      "text-anchor": "top",
      "text-optional": true,
    },
    paint: {
      "text-color": tokenColor("--ink"),
      "text-halo-color": tokenColor("--paper"),
      "text-halo-width": 1.5,
    },
  });
}

/**
 * Doodle look, part 2: an SVG filter that nudges every pixel a little, so straight map lines
 * come out wobbly, as if drawn by hand. ExploreMap puts the filter on the page and points the map at it.
 */
export const DOODLE_FILTER = { id: "doodle", frequency: 0.018, strength: 7 };

/**
 * T lines drawn like a highlighter pen: a wide see-through stroke in the line's official colour...
 * Each feature carries that colour in a `color` property.
 */
export const T_LINE_HIGHLIGHT_LAYER: LayerProps = {
  id: "t-lines-highlight",
  type: "line",
  layout: { "line-cap": "round", "line-join": "round" },
  paint: {
    "line-color": ["get", "color"],
    "line-opacity": 0.38,
    "line-width": ["interpolate", ["linear"], ["zoom"], 10, 11, 14, 24],
  },
};

/** ...with a solid line of the same colour down the middle, so it still reads from far away. */
export const T_LINE_LAYER: LayerProps = {
  id: "t-lines",
  type: "line",
  layout: { "line-cap": "round", "line-join": "round" },
  paint: {
    "line-color": ["get", "color"],
    "line-width": ["interpolate", ["linear"], ["zoom"], 10, 3, 14, 6],
  },
};

/** Live trains: a dot in the line's colour with a cream rim, drawn on the map itself so it can move smoothly. */
export function trainLayer(): LayerProps {
  return {
    id: "trains",
    type: "circle",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3.5, 15, 8],
      "circle-color": ["get", "color"],
      "circle-stroke-color": tokenColor("--paper"),
      "circle-stroke-width": 2.5,
      "circle-pitch-alignment": "map",
    },
  };
}

export type MapPoint = { longitude: number; latitude: number; color: string };

export function pointsToGeoJSON(points: MapPoint[]) {
  return {
    type: "FeatureCollection" as const,
    features: points.map((point) => ({
      type: "Feature" as const,
      properties: { color: point.color },
      geometry: { type: "Point" as const, coordinates: [point.longitude, point.latitude] },
    })),
  };
}

/** Replaces the points of a GeoJSON source that is already on the map. Safe to call before the map is ready. */
export function setSourcePoints(map: MapLibreMap, sourceId: string, points: MapPoint[]) {
  const source = map.getSource(sourceId) as GeoJSONSource | undefined;
  source?.setData(pointsToGeoJSON(points));
}

/**
 * Flies the camera down to a station, leaving room for the sheet
 * (bottom of the screen on phones, right side on wider screens).
 * MapLibre skips the flight by itself when the visitor asked for Reduced Motion.
 */
export function flyToStation(map: MapLibreMap, station: { longitude: number; latitude: number }) {
  const box = map.getContainer();
  const isPhone = window.innerWidth < 640;
  map.flyTo({
    center: [station.longitude, station.latitude],
    zoom: Math.max(map.getZoom(), 15.2),
    pitch: 62,
    padding: {
      top: 0,
      left: 0,
      bottom: isPhone ? box.clientHeight * 0.35 : 0,
      // The sheet is 24rem wide on wider screens.
      right: isPhone ? 0 : Math.min(384, box.clientWidth * 0.4),
    },
    duration: 1600,
  });
}

/** Undoes the room left for the sheet. */
export function clearCameraPadding(map: MapLibreMap) {
  map.easeTo({ padding: { top: 0, left: 0, right: 0, bottom: 0 }, duration: 400 });
}

/** Decodes a Google encoded polyline (the format MBTA shapes use) into [longitude, latitude] pairs. */
export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const next = () => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < encoded.length) {
    lat += next();
    lng += next();
    points.push([lng / 1e5, lat / 1e5]);
  }
  return points;
}

/** Turns encoded shapes into the GeoJSON a <Source type="geojson"> expects. */
export function shapesToGeoJSON(shapes: { polyline: string; color: string }[]) {
  return {
    type: "FeatureCollection" as const,
    features: shapes.map((shape) => ({
      type: "Feature" as const,
      properties: { color: shape.color },
      geometry: { type: "LineString" as const, coordinates: decodePolyline(shape.polyline) },
    })),
  };
}
