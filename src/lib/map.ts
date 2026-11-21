// All map setup in one place: MapLibre GL through react-map-gl, free OpenFreeMap tiles.
// Browser only. Load any component that imports this with next/dynamic and ssr: false.
import "maplibre-gl/dist/maplibre-gl.css";
import { setWorkerUrl } from "maplibre-gl";
import type {
  ExpressionSpecification,
  GeoJSONSource,
  LayerSpecification,
  Map as MapLibreMap,
  StyleSpecification,
} from "maplibre-gl";
import type { LayerProps } from "react-map-gl/maplibre";

export { Layer, Map, Marker, NavigationControl, Source, useMap } from "react-map-gl/maplibre";
export type { MapRef } from "react-map-gl/maplibre";

// MapLibre 6 draws tiles in a web worker and looks for the worker file next to its own script.
// A bundler moves that script, so we hand it the worker file's real address.
setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);

/** OpenFreeMap "positron": free streets, no API key. We repaint it in our own palette below. */
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

/**
 * The atlas palette: warm, muted, low-saturation, like an architectural publication.
 * These six colours are Rachel's brief (Nov 21). They live here, not in globals.css, because that file
 * is shared; once the team agrees they should move there as tokens and this object should read them.
 * ExploreMap also hands them to the page as CSS variables (--atlas-land and so on) for things drawn on top.
 */
export const ATLAS = {
  land: "#F1EFE9", // warm stone
  water: "#DCE5E1", // misty sage-grey
  road: "#FAF9F5", // soft ivory
  building: "#C9C2B5", // warm sandstone
  outline: "#645F58", // dark taupe: building edges and place names
  park: "#D4DDCF", // desaturated sage
} as const;

/** The palette as CSS variables, for a wrapper element's `style`. */
export const atlasCssVars = Object.fromEntries(
  Object.entries(ATLAS).map(([name, value]) => [`--atlas-${name}`, value]),
) as Record<string, string>;

/**
 * A colour token from globals.css (for example "--paper") as a colour the map can use.
 * The map cannot read CSS variables or oklch itself, so the browser converts it for us.
 */
export function tokenColor(token: string, alpha = 1): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx) return value;
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * The base map as an architectural atlas: stone land, ivory streets, sage-grey water,
 * and every real building as a quiet sandstone footprint with a hairline edge.
 * This repaints the map's own layers; nothing is filtered on top, so the T colours stay true.
 */
export async function loadMapStyle(): Promise<StyleSpecification> {
  const style: StyleSpecification = await fetch(BASE_STYLE).then((res) => res.json());

  style.layers = style.layers.flatMap((layer): LayerSpecification[] => {
    const sourceLayer = "source-layer" in layer ? layer["source-layer"] : undefined;

    if (layer.type === "background") return [{ ...layer, paint: { "background-color": ATLAS.land } }];

    if (layer.type === "fill") {
      if (sourceLayer === "water") return [{ ...layer, paint: { "fill-color": ATLAS.water } }];
      if (sourceLayer === "park") return [{ ...layer, paint: { "fill-color": ATLAS.park } }];
      // Background buildings: low-contrast footprints, plus a thin outline that fades in as you zoom.
      if (sourceLayer === "building")
        return [
          {
            ...layer,
            minzoom: 13,
            paint: {
              "fill-color": ATLAS.building,
              "fill-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0.35, 15, 0.7],
            },
          },
          {
            id: "building-outline",
            type: "line" as const,
            source: layer.source,
            "source-layer": "building",
            minzoom: 14,
            paint: {
              "line-color": ATLAS.outline,
              "line-width": 0.6,
              "line-opacity": ["interpolate", ["linear"], ["zoom"], 14, 0.15, 16, 0.5],
            },
          },
        ];
      // Land-use patches would only add noise.
      return [];
    }

    if (layer.type === "line") {
      if (sourceLayer === "boundary" || layer.id.endsWith("_casing") || layer.id.endsWith("dashline")) return [];
      if (sourceLayer === "waterway") return [{ ...layer, paint: { "line-color": ATLAS.water } }];
      return [{ ...layer, paint: { ...layer.paint, "line-color": ATLAS.road, "line-opacity": 1 } }];
    }

    if (layer.type === "symbol") {
      // Road-number shields are grey sprite images from the base style; leave them out.
      if (layer.id.includes("shield")) return [];
      return [
        {
          ...layer,
          paint: {
            "text-color": ATLAS.outline,
            "text-opacity": 0.85,
            "text-halo-color": ATLAS.land,
            "text-halo-width": 1.2,
          },
        },
      ];
    }

    return [layer];
  });

  return style;
}

/**
 * Hospitals from the map's own place data, each with a small quiet cross tile in the atlas palette.
 * They appear from zoom 14, where the map data carries places. Call once the map has loaded.
 */
export function addStickerLayers(map: MapLibreMap) {
  if (map.getLayer("sticker-hospital")) return;
  const size = 44;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  ctx.translate(size / 2, size / 2);
  ctx.lineJoin = "round";
  ctx.lineWidth = 2;
  ctx.fillStyle = ATLAS.road;
  ctx.strokeStyle = ATLAS.outline;
  ctx.beginPath();
  ctx.roundRect(-15, -15, 30, 30, 6);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(0, 7);
  ctx.moveTo(-7, 0);
  ctx.lineTo(7, 0);
  ctx.stroke();
  ctx.resetTransform();
  map.addImage("sticker-hospital", ctx.getImageData(0, 0, size, size), { pixelRatio: 2 });

  map.addLayer({
    id: "sticker-hospital",
    type: "symbol",
    source: "openmaptiles",
    "source-layer": "poi",
    minzoom: 14,
    filter: ["==", ["get", "class"], "hospital"],
    layout: {
      "icon-image": "sticker-hospital",
      "icon-size": 0.9,
      "text-field": ["step", ["zoom"], "", 15, ["get", "name"]],
      "text-font": ["Noto Sans Regular"],
      "text-size": 10,
      "text-offset": [0, 1.3],
      "text-anchor": "top",
      "text-optional": true,
    },
    paint: {
      "icon-opacity": 0.9,
      "text-color": ATLAS.outline,
      "text-halo-color": ATLAS.land,
      "text-halo-width": 1.2,
    },
  });
}

/**
 * T lines, in their official colours (each feature carries `color` and `lineId`).
 * By default every line is drawn evenly and a little soft. When a station is selected, its lines
 * come forward at full strength and the others step back.
 */
export function tLineLayers(highlightLineIds: string[]): { casing: LayerProps; line: LayerProps } {
  const hasHighlight = highlightLineIds.length > 0;
  const isHighlighted: ExpressionSpecification = ["in", ["get", "lineId"], ["literal", highlightLineIds]];
  return {
    // A soft ivory edge, so lines stay crisp over buildings without a hard dark outline.
    casing: {
      id: "t-lines-casing",
      type: "line",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": ATLAS.road,
        "line-opacity": 0.9,
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 4, 14, 8],
      },
    },
    line: {
      id: "t-lines",
      type: "line",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": ["get", "color"],
        "line-opacity": hasHighlight ? ["case", isHighlighted, 1, 0.3] : 0.85,
        "line-width": hasHighlight
          ? ["interpolate", ["linear"], ["zoom"], 10, ["case", isHighlighted, 3.2, 2], 14, ["case", isHighlighted, 6.5, 4]]
          : ["interpolate", ["linear"], ["zoom"], 10, 2.2, 14, 4.5],
      },
    },
  };
}

/** Live trains: a dot in the line's colour with an ivory rim, drawn on the map itself so it can move smoothly. */
export function trainLayer(): LayerProps {
  return {
    id: "trains",
    type: "circle",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3, 15, 7],
      "circle-color": ["get", "color"],
      "circle-stroke-color": ATLAS.road,
      "circle-stroke-width": 2,
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
 * Glides the camera to a station and leans in a little, without diving all the way down.
 * MapLibre skips the glide by itself when the visitor asked for Reduced Motion.
 */
export function flyToStation(map: MapLibreMap, station: { longitude: number; latitude: number }) {
  map.flyTo({
    center: [station.longitude, station.latitude],
    zoom: Math.max(map.getZoom(), 14.3),
    pitch: 58,
    // Leaves room above the station for its ticket.
    padding: { top: 180, left: 0, right: 0, bottom: 0 },
    duration: 1200,
  });
}

/** Undoes the room left for the ticket. */
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
export function shapesToGeoJSON(shapes: { polyline: string; color: string; lineId: string }[]) {
  return {
    type: "FeatureCollection" as const,
    features: shapes.map((shape) => ({
      type: "Feature" as const,
      properties: { color: shape.color, lineId: shape.lineId },
      geometry: { type: "LineString" as const, coordinates: decodePolyline(shape.polyline) },
    })),
  };
}
