"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Layer,
  MAX_BOUNDS,
  MAX_PITCH,
  MIN_ZOOM,
  Map,
  NavigationControl,
  Source,
  T_LINE_HIGHLIGHT_LAYER,
  T_LINE_LAYER,
  DOODLE_FILTER,
  addDoodleTextures,
  addStickerLayers,
  clearCameraPadding,
  flyToStation,
  initialView,
  loadMapStyle,
  shapesToGeoJSON,
  type MapRef,
} from "@/lib/map";
import { cn } from "@/lib/utils";
import { content } from "./content";
import { useCompleted } from "./progress";
import { StationMarker } from "./StationMarker";
import { StationSheet } from "./StationSheet";
import { TrainsLayer } from "./TrainsLayer";
import type { LiveData, SubwayData, SubwayStation } from "./types";

type MapStyle = Awaited<ReturnType<typeof loadMapStyle>>;

const getJson = <T,>(url: string): Promise<T> =>
  fetch(url).then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))));

// Both downloads start the moment this file arrives in the browser, before React has drawn anything.
const stylePromise = loadMapStyle();
const subwayPromise = getJson<SubwayData>("/api/subway");

/**
 * The real map of Boston with T lines, live trains and one floating marker per station. Browser only.
 * It fills the whole screen (fixed, under the site nav) so other UI can be layered on top of it.
 */
export default function ExploreMap() {
  const mapRef = useRef<MapRef>(null);
  const [style, setStyle] = useState<MapStyle | null>(null);
  const [data, setData] = useState<SubwayData | null>(null);
  const [live, setLive] = useState<LiveData | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<SubwayStation | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  // The hand-drawn wobble is switched off while the map is being dragged, so dragging stays smooth.
  const [moving, setMoving] = useState(false);
  const completed = useCompleted();

  // Streets and the T load side by side; the streets show as soon as they are ready.
  useEffect(() => {
    let cancelled = false;
    stylePromise.then((mapStyle) => !cancelled && setStyle(mapStyle)).catch(() => !cancelled && setFailed(true));
    subwayPromise.then((subway) => !cancelled && setData(subway)).catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  // Trains and elevator outages: refreshed every few seconds. If a refresh fails we keep the last one.
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      getJson<LiveData>("/api/subway/live")
        .then((json) => !cancelled && setLive(json))
        .catch(() => {});
    load();
    const timer = window.setInterval(load, content.liveRefreshMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const lineGeoJSON = useMemo(() => {
    if (!data) return null;
    const colorOf = new globalThis.Map(data.lines.map((line) => [line.id, line.color]));
    return shapesToGeoJSON(
      data.shapes.map((shape) => ({ polyline: shape.polyline, color: colorOf.get(shape.lineId) ?? "" })),
    );
  }, [data]);

  const outagesByStation = useMemo(() => {
    const byStation = new globalThis.Map<string, string[]>();
    for (const outage of live?.outages ?? []) {
      byStation.set(outage.stationId, [...(byStation.get(outage.stationId) ?? []), outage.header]);
    }
    return byStation;
  }, [live]);

  const openStation = useCallback((station: SubwayStation) => {
    setSelected(station);
    setSheetOpen(true);
    const map = mapRef.current?.getMap();
    if (map) flyToStation(map, station);
  }, []);

  const onSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    const map = mapRef.current?.getMap();
    if (!open && map) clearCameraPadding(map);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-0 z-30 bg-paper",
        !moving && "[&_.maplibregl-canvas]:[filter:url(#doodle)]",
      )}
    >
      {/* The wobble itself: see DOODLE_FILTER in src/lib/map.ts */}
      <svg aria-hidden className="absolute size-0">
        <filter id={DOODLE_FILTER.id}>
          <feTurbulence type="fractalNoise" baseFrequency={DOODLE_FILTER.frequency} numOctaves={2} seed={4} />
          <feDisplacementMap in="SourceGraphic" scale={DOODLE_FILTER.strength} />
        </filter>
      </svg>
      {style && (
        <Map
          ref={mapRef}
          initialViewState={initialView()}
          attributionControl={{ compact: true }}
          mapStyle={style}
          maxBounds={MAX_BOUNDS}
          maxPitch={MAX_PITCH}
          minZoom={MIN_ZOOM}
          style={{ width: "100%", height: "100%" }}
          onLoad={(event) => {
            addDoodleTextures(event.target);
            addStickerLayers(event.target);
          }}
          onMoveStart={() => setMoving(true)}
          onMoveEnd={() => setMoving(false)}
        >
          <NavigationControl position="bottom-right" visualizePitch />
          {lineGeoJSON && (
            <Source id="t-lines" type="geojson" data={lineGeoJSON}>
              <Layer {...T_LINE_HIGHLIGHT_LAYER} />
              <Layer {...T_LINE_LAYER} />
            </Source>
          )}
          {data && <TrainsLayer trains={live?.trains ?? []} lines={data.lines} />}
          {data?.stations.map((station, index) => (
            <StationMarker
              key={station.id}
              station={station}
              index={index}
              completed={completed.has(station.id)}
              outage={outagesByStation.has(station.id)}
              onSelect={openStation}
            />
          ))}
        </Map>
      )}

      {live && data && (
        <p className="absolute top-20 left-3 flex items-center gap-2 rounded-full border-2 border-ink bg-popover px-3 py-1.5 font-pixel text-[0.55rem] text-popover-foreground shadow-chip">
          <span
            className={cn(
              "size-2 rounded-full border border-ink",
              live.source === "live" ? "animate-pulse bg-leaf" : "bg-steel",
            )}
          />
          {live.source === "live" ? content.liveChip(live.trains.length) : content.sampleChip}
        </p>
      )}

      {!data && (
        <p className="absolute inset-x-0 bottom-4 mx-auto w-fit rounded-full border-2 border-ink bg-popover px-4 py-2 font-pixel text-[0.6rem] text-popover-foreground shadow-chip">
          {failed ? content.error : content.loading}
        </p>
      )}

      <StationSheet
        station={selected}
        open={sheetOpen}
        onOpenChange={onSheetOpenChange}
        lines={data?.lines ?? []}
        stations={data?.stations ?? []}
        completed={completed}
        outages={selected ? (outagesByStation.get(selected.id) ?? []) : []}
        liveSource={live?.source ?? "snapshot"}
      />
    </div>
  );
}
