"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  INITIAL_VIEW,
  Layer,
  MAP_STYLE,
  MAX_BOUNDS,
  MAX_PITCH,
  MIN_ZOOM,
  Map,
  NavigationControl,
  Source,
  T_LINE_LAYER,
  shapesToGeoJSON,
} from "@/lib/map";
import { content } from "./content";
import { useCompleted } from "./progress";
import { StationMarker } from "./StationMarker";
import { StationSheet } from "./StationSheet";
import type { SubwayData, SubwayStation } from "./types";

/** The real map of Boston with T lines and one floating marker per station. Browser only. */
export default function ExploreMap() {
  const [data, setData] = useState<SubwayData | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<SubwayStation | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const completed = useCompleted();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/subway")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((json: SubwayData) => !cancelled && setData(json))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const lineGeoJSON = useMemo(() => {
    if (!data) return null;
    const colorOf = new globalThis.Map(data.lines.map((line) => [line.id, line.color]));
    return shapesToGeoJSON(
      data.shapes.map((shape) => ({ polyline: shape.polyline, color: colorOf.get(shape.lineId) ?? "" })),
    );
  }, [data]);

  const openStation = useCallback((station: SubwayStation) => {
    setSelected(station);
    setSheetOpen(true);
  }, []);

  return (
    <div className="relative h-[70dvh] min-h-96 overflow-hidden rounded-2xl border-2 border-ink bg-paper shadow-tile">
      <Map
        initialViewState={INITIAL_VIEW}
        mapStyle={MAP_STYLE}
        maxBounds={MAX_BOUNDS}
        maxPitch={MAX_PITCH}
        minZoom={MIN_ZOOM}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" visualizePitch />
        {lineGeoJSON && (
          <Source id="t-lines" type="geojson" data={lineGeoJSON}>
            <Layer {...T_LINE_LAYER} />
          </Source>
        )}
        {data?.stations.map((station, index) => (
          <StationMarker
            key={station.id}
            station={station}
            index={index}
            completed={completed.has(station.id)}
            onSelect={openStation}
          />
        ))}
      </Map>

      {!data && (
        <p className="absolute inset-x-0 bottom-4 mx-auto w-fit rounded-full border-2 border-ink bg-popover px-4 py-2 font-pixel text-[0.6rem] text-popover-foreground shadow-chip">
          {failed ? content.error : content.loading}
        </p>
      )}

      <StationSheet
        station={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        lines={data?.lines ?? []}
        stations={data?.stations ?? []}
        completed={completed}
      />
    </div>
  );
}
