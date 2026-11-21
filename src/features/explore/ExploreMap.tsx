"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MotionConfig } from "motion/react";
import {
  Layer,
  MAX_BOUNDS,
  MAX_PITCH,
  MIN_ZOOM,
  Map,
  NavigationControl,
  Source,
  addStickerLayers,
  atlasCssVars,
  clearCameraPadding,
  flyToStation,
  initialView,
  loadMapStyle,
  shapesToGeoJSON,
  tLineLayers,
  type MapRef,
} from "@/lib/map";
import { cn } from "@/lib/utils";
import { content, landmarks, type Landmark } from "./content";
import { LandmarkMarker } from "./LandmarkMarker";
import { MissionTicket } from "./MissionTicket";
import { useCompleted } from "./progress";
import { StationMarker, type StationKind } from "./StationMarker";
import { StationSheet } from "./StationSheet";
import { TrainsLayer } from "./TrainsLayer";
import type { LiveData, SubwayData, SubwayStation } from "./types";

type MapStyle = Awaited<ReturnType<typeof loadMapStyle>>;

const getJson = <T,>(url: string): Promise<T> =>
  fetch(url).then((res) =>
    res.ok ? res.json() : Promise.reject(new Error(String(res.status))),
  );

// Both downloads start the moment this file arrives in the browser, before React has drawn anything.
const stylePromise = loadMapStyle();
const subwayPromise = getJson<SubwayData>("/api/subway");

const landmarkOfStation = new globalThis.Map(
  landmarks.map((landmark) => [landmark.stationId, landmark]),
);

/**
 * The real map of Boston as a small city model: T lines, live trains, quiet station dots,
 * a few miniature landmarks floating above the ground, and a ticket for the selected stop. Browser only.
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
  // Rounded to half steps, so markers only redraw when the zoom has really changed.
  const [zoom, setZoom] = useState(12);
  const completed = useCompleted();

  // Streets and the T load side by side; the streets show as soon as they are ready.
  useEffect(() => {
    let cancelled = false;
    stylePromise
      .then((mapStyle) => !cancelled && setStyle(mapStyle))
      .catch(() => !cancelled && setFailed(true));
    subwayPromise
      .then((subway) => !cancelled && setData(subway))
      .catch(() => !cancelled && setFailed(true));
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
    const colorOf = new globalThis.Map(
      data.lines.map((line) => [line.id, line.color]),
    );
    return shapesToGeoJSON(
      data.shapes.map((shape) => ({
        polyline: shape.polyline,
        lineId: shape.lineId,
        color: colorOf.get(shape.lineId) ?? "",
      })),
    );
  }, [data]);

  const outagesByStation = useMemo(() => {
    const byStation = new globalThis.Map<string, string[]>();
    for (const outage of live?.outages ?? []) {
      byStation.set(outage.stationId, [
        ...(byStation.get(outage.stationId) ?? []),
        outage.header,
      ]);
    }
    return byStation;
  }, [live]);

  const stationById = useMemo(
    () =>
      new globalThis.Map(
        (data?.stations ?? []).map((station) => [station.id, station]),
      ),
    [data],
  );
  const colorOfLine = useMemo(
    () =>
      new globalThis.Map(
        (data?.lines ?? []).map((line) => [line.id, line.color]),
      ),
    [data],
  );

  // Selecting a stop glides the camera there and shows its ticket. The full sheet opens from the ticket.
  const selectStation = useCallback((station: SubwayStation) => {
    setSelected(station);
    const map = mapRef.current?.getMap();
    if (map) flyToStation(map, station);
  }, []);

  const selectLandmark = useCallback(
    (landmark: Landmark) => {
      const station = stationById.get(landmark.stationId);
      if (station) selectStation(station);
    },
    [stationById, selectStation],
  );

  const clearSelection = useCallback(() => {
    setSelected(null);
    const map = mapRef.current?.getMap();
    if (map) clearCameraPadding(map);
  }, []);

  // The selected station's lines come forward; the rest step back.
  const selectedLineKey = selected?.lineIds.join(",") ?? "";
  const lineLayers = useMemo(() => tLineLayers(selectedLineKey ? selectedLineKey.split(",") : []), [selectedLineKey]);

  const landmarkScale = Math.min(1.4, Math.max(0.5, 0.55 + (zoom - 12) * 0.22));

  return (
    <MotionConfig reducedMotion="user">
      <div className="fixed inset-0 z-30" style={{ ...atlasCssVars, backgroundColor: "var(--atlas-land)" }}>
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
            onLoad={(event) => addStickerLayers(event.target)}
            onZoom={(event) =>
              setZoom(Math.round(event.viewState.zoom * 2) / 2)
            }
            onClick={(event) => {
              // Taps on markers and tickets also reach the map; only a tap on bare map clears the selection.
              const target = event.originalEvent.target as HTMLElement | null;
              if (!target?.closest(".maplibregl-marker")) clearSelection();
            }}
          >
            <NavigationControl position="bottom-right" visualizePitch />
            {lineGeoJSON && (
              <Source id="t-lines" type="geojson" data={lineGeoJSON}>
                <Layer {...lineLayers.casing} />
                <Layer {...lineLayers.line} />
              </Source>
            )}
            {data && (
              <TrainsLayer trains={live?.trains ?? []} lines={data.lines} />
            )}
            {data?.stations.map((station) => {
              const outage = outagesByStation.has(station.id);
              // A mission is somewhere with something to do now: an elevator out, or a landmark stop.
              const kind: StationKind =
                outage || landmarkOfStation.has(station.id)
                  ? "mission"
                  : station.lineIds.length > 1
                    ? "hub"
                    : "stop";
              return (
                <StationMarker
                  key={station.id}
                  station={station}
                  kind={kind}
                  color={colorOfLine.get(station.lineIds[0]) ?? ""}
                  completed={completed.has(station.id)}
                  selected={selected?.id === station.id}
                  outage={outage}
                  compact={zoom < 12}
                  onSelect={selectStation}
                />
              );
            })}
            {data &&
              zoom >= content.landmarkMinZoom &&
              landmarks.map((landmark) => (
                <LandmarkMarker
                  key={landmark.id}
                  landmark={landmark}
                  scale={landmarkScale}
                  selected={selected?.id === landmark.stationId}
                  onSelect={selectLandmark}
                />
              ))}
            {data && selected && (
              <MissionTicket
                station={selected}
                number={data.stations.indexOf(selected) + 1}
                lines={data.lines}
                landmark={landmarkOfStation.get(selected.id)}
                completed={completed.has(selected.id)}
                outage={outagesByStation.has(selected.id)}
                onOpen={() => setSheetOpen(true)}
                onClose={clearSelection}
              />
            )}
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
            {live.source === "live"
              ? content.liveChip(live.trains.length)
              : content.sampleChip}
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
          onOpenChange={setSheetOpen}
          lines={data?.lines ?? []}
          stations={data?.stations ?? []}
          completed={completed}
          outages={selected ? (outagesByStation.get(selected.id) ?? []) : []}
          liveSource={live?.source ?? "snapshot"}
        />
      </div>
    </MotionConfig>
  );
}
