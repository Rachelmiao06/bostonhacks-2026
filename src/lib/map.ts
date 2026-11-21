// All map setup in one place: MapLibre GL through react-map-gl, free OpenFreeMap tiles.
// Browser only. Load any component that imports this with next/dynamic and ssr: false.
import "maplibre-gl/dist/maplibre-gl.css";
import { setWorkerUrl } from "maplibre-gl";
import type { LayerProps } from "react-map-gl/maplibre";

// MapLibre 6 draws tiles in a web worker and looks for the worker file next to its own script.
// A bundler moves that script, so we hand it the worker file's real address.
setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);

export { Layer, Map, Marker, NavigationControl, Source } from "react-map-gl/maplibre";

/** OpenFreeMap "positron": light grey streets, no API key. */
export const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

/** Downtown Boston, tilted like a game board. */
export const INITIAL_VIEW = {
  longitude: -71.0712,
  latitude: 42.3522,
  zoom: 12.3,
  pitch: 55,
  bearing: 0,
};

export const MAX_PITCH = 70;
export const MIN_ZOOM = 9.5;

/** Keeps the camera around Greater Boston: [west, south, east, north]. */
export const MAX_BOUNDS: [number, number, number, number] = [-71.65, 42.0, -70.6, 42.7];

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
