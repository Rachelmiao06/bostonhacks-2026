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

/**
 * Reads a colour token from globals.css (for example "--paper") as a colour the map can use.
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
 * The board-game look: cream paper land, blue water, faint streets, 3D buildings.
 * Every colour comes from a token in globals.css, so a theme change restyles the map too.
 */
export async function loadMapStyle(): Promise<StyleSpecification> {
  const style: StyleSpecification = await fetch(BASE_STYLE).then((res) => res.json());
  const paper = tokenColor("--paper");
  const land = tokenColor("--muted");
  const water = tokenColor("--sky");

  style.layers = style.layers.flatMap((layer): LayerSpecification[] => {
    const sourceLayer = "source-layer" in layer ? layer["source-layer"] : undefined;

    if (layer.type === "background") return [{ ...layer, paint: { "background-color": paper } }];

    if (layer.type === "fill") {
      if (sourceLayer === "water") return [{ ...layer, paint: { "fill-color": water } }];
      if (sourceLayer === "park" || sourceLayer === "landcover")
        return [{ ...layer, paint: { "fill-color": tokenColor("--leaf", 0.3) } }];
      // Flat buildings are replaced by a 3D layer.
      if (sourceLayer === "building")
        return [
          {
            id: "building-3d",
            type: "fill-extrusion" as const,
            source: layer.source,
            "source-layer": "building",
            minzoom: 13,
            paint: {
              "fill-extrusion-color": land,
              "fill-extrusion-height": ["coalesce", ["get", "render_height"], 6],
              "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
              "fill-extrusion-opacity": 0.9,
            },
          },
        ];
      return [{ ...layer, paint: { "fill-color": paper } }];
    }

    if (layer.type === "line") {
      if (sourceLayer === "boundary" || layer.id.endsWith("_casing") || layer.id.endsWith("dashline")) return [];
      if (sourceLayer === "waterway") return [{ ...layer, paint: { "line-color": water } }];
      // Streets stay faint so the T lines are the loudest thing on the board.
      return [{ ...layer, paint: { ...layer.paint, "line-color": land, "line-opacity": 1 } }];
    }

    if (layer.type === "symbol") {
      // Road-number shields are grey sprite images from the base style; leave them out.
      if (layer.id.includes("shield")) return [];
      return [
        {
          ...layer,
          paint: { "text-color": tokenColor("--ink", 0.75), "text-halo-color": paper, "text-halo-width": 1.5 },
        },
      ];
    }

    return [layer];
  });

  // The 3D buildings sit above the streets but below the labels: move them just before the first label.
  const buildings = style.layers.filter((layer) => layer.id === "building-3d");
  const rest = style.layers.filter((layer) => layer.id !== "building-3d");
  const firstLabel = rest.findIndex((layer) => layer.type === "symbol");
  rest.splice(firstLabel === -1 ? rest.length : firstLabel, 0, ...buildings);
  style.layers = rest;

  return style;
}

/** Navy outline under each T line, the same "ink edge" the buttons and cards have. */
export function tLineCasingLayer(): LayerProps {
  return {
    id: "t-lines-casing",
    type: "line",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": tokenColor("--ink"),
      "line-width": ["interpolate", ["linear"], ["zoom"], 10, 6, 14, 11],
    },
  };
}

/** T lines. Each feature carries its official colour in a `color` property. */
export const T_LINE_LAYER: LayerProps = {
  id: "t-lines",
  type: "line",
  layout: { "line-cap": "round", "line-join": "round" },
  paint: {
    "line-color": ["get", "color"],
    "line-width": ["interpolate", ["linear"], ["zoom"], 10, 3, 14, 7],
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
      right: isPhone ? 0 : box.clientWidth * 0.3,
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
