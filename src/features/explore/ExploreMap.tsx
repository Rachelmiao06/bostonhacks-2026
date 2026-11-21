"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { MotionConfig } from "motion/react";
import type { Quest } from "@/lib/mbta";
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
  initialView,
  loadMapStyle,
  shapesToGeoJSON,
  tLineLayers,
  type MapRef,
} from "@/lib/map";
import { categoryOf } from "./category";
import { ContributePanel } from "./ContributePanel";
import { categories, content, landmarks, type CategoryId, type Landmark } from "./content";
import { LandmarkMarker } from "./LandmarkMarker";
import { FilterBar, ProgressChip, StatusChip } from "./MapOverlays";
import { ClusterPin, ProblemPin } from "./ProblemMarker";
import { verifiedOf } from "./verified";
import { ProblemTicket } from "./ProblemTicket";
import { useMyProgress } from "./progress";
import { clusterStops, problemStops, useQuests, type Cluster, type ProblemStop } from "./quests";
import { StationMarker } from "./StationMarker";
import { TrainsLayer } from "./TrainsLayer";
import type { LiveData, SubwayData, SubwayStation } from "./types";

type MapStyle = Awaited<ReturnType<typeof loadMapStyle>>;

const getJson = <T,>(url: string): Promise<T> =>
  fetch(url).then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))));

// Both downloads start the moment this file arrives in the browser, before React has drawn anything.
const stylePromise = loadMapStyle();
const subwayPromise = getJson<SubwayData>("/api/subway");

const landmarkOfStation = new globalThis.Map(landmarks.map((landmark) => [landmark.stationId, landmark]));
const ALL = new Set<CategoryId>(categories.map((c) => c.id));
const NOTHING_DONE: ReadonlySet<string> = new Set();

/** True on screens at least 640px wide (tickets pin to the map there; on phones they dock at the bottom). */
function useWide() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(min-width: 640px)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(min-width: 640px)").matches,
    () => true,
  );
}

/**
 * The real map of Boston as a small city model, with the open MBTA problems laid over it.
 * Pick a pin to read its ticket; from the ticket, contribute. Browser only.
 * It fills the whole screen (fixed, under the floating nav) so other UI can be layered on top of it.
 */
export default function ExploreMap() {
  const mapRef = useRef<MapRef>(null);
  const wide = useWide();
  const [style, setStyle] = useState<MapStyle | null>(null);
  const [data, setData] = useState<SubwayData | null>(null);
  const [live, setLive] = useState<LiveData | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<SubwayStation | null>(null);
  const [questIndex, setQuestIndex] = useState(0);
  const [panelQuest, setPanelQuest] = useState<Quest | null>(null);
  const [show, setShow] = useState<ReadonlySet<CategoryId>>(ALL);
  // Rounded to half steps, so markers only redraw when the zoom has really changed.
  const [zoom, setZoom] = useState(12);
  const quests = useQuests();
  const progress = useMyProgress();
  const done = progress.status === "ready" ? progress.done : NOTHING_DONE;

  // Streets and the T load side by side; the streets show as soon as they are ready.
  useEffect(() => {
    let cancelled = false;
    stylePromise.then((mapStyle) => !cancelled && setStyle(mapStyle)).catch(() => !cancelled && setFailed(true));
    subwayPromise.then((subway) => !cancelled && setData(subway)).catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  // Train positions: refreshed every few seconds. If a refresh fails we keep the last one.
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
      data.shapes.map((shape) => ({ polyline: shape.polyline, lineId: shape.lineId, color: colorOf.get(shape.lineId) ?? "" })),
    );
  }, [data]);

  const stationById = useMemo(() => new globalThis.Map((data?.stations ?? []).map((s) => [s.id, s])), [data]);
  const colorOfLine = useMemo(() => new globalThis.Map((data?.lines ?? []).map((line) => [line.id, line.color])), [data]);

  const questList = useMemo(() => (quests.status === "ready" ? quests.quests : []), [quests]);
  const stops = useMemo(() => problemStops(questList, stationById, show), [questList, stationById, show]);
  const stopById = useMemo(() => new globalThis.Map(stops.map((stop) => [stop.station.id, stop])), [stops]);
  const clusters = useMemo(() => clusterStops(stops, zoom), [stops, zoom]);

  // Counts per category ignore the filter, so every chip always says how many there are.
  const counts = useMemo(() => {
    const all = problemStops(questList, stationById, ALL).flatMap((stop) => stop.quests);
    return Object.fromEntries(categories.map((c) => [c.id, all.filter((q) => categoryOf(q) === c.id).length])) as Record<CategoryId, number>;
  }, [questList, stationById]);

  // Selecting a stop glides the camera there and leaves room for its ticket.
  const focus = useCallback(
    (station: SubwayStation) => {
      const map = mapRef.current?.getMap();
      if (!map) return;
      // Wide: the ticket stands above the stop, under the nav and filters. Phone: it docks at the bottom.
      map.flyTo({
        center: [station.longitude, station.latitude],
        zoom: Math.max(map.getZoom(), wide ? 14.3 : 14),
        pitch: wide ? 58 : 50,
        padding: wide ? { top: 420, bottom: 0, left: 0, right: 0 } : { top: 120, bottom: 340, left: 0, right: 0 },
        duration: 1200,
      });
    },
    [wide],
  );

  const selectStation = useCallback(
    (station: SubwayStation, index = 0) => {
      setSelected(station);
      setQuestIndex(index);
      focus(station);
    },
    [focus],
  );

  const selectStop = useCallback((stop: ProblemStop) => selectStation(stop.station), [selectStation]);

  const selectLandmark = useCallback(
    (landmark: Landmark) => {
      const station = stationById.get(landmark.stationId);
      if (station) selectStation(station);
    },
    [stationById, selectStation],
  );

  const expandCluster = useCallback((cluster: Cluster) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const lons = cluster.stops.map((s) => s.station.longitude);
    const lats = cluster.stops.map((s) => s.station.latitude);
    map.fitBounds(
      [
        [Math.min(...lons), Math.min(...lats)],
        [Math.max(...lons), Math.max(...lats)],
      ],
      { padding: 120, maxZoom: 15, duration: 900 },
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(null);
    const map = mapRef.current?.getMap();
    if (map) clearCameraPadding(map);
  }, []);

  // A link like /?quest=<id> (from My Journey) opens that problem's ticket once everything has loaded.
  const deepLinked = useRef(false);
  useEffect(() => {
    if (deepLinked.current || !style || !data || quests.status !== "ready") return;
    const id = new URLSearchParams(window.location.search).get("quest");
    if (!id) return;
    deepLinked.current = true;
    const stop = problemStops(quests.quests, stationById, ALL).find((s) => s.quests.some((q) => q.id === id));
    // Wait a frame so the map has mounted before the camera moves.
    if (stop) requestAnimationFrame(() => selectStation(stop.station, stop.quests.findIndex((q) => q.id === id)));
  }, [style, data, quests, stationById, selectStation]);

  const toggleFilter = useCallback((id: CategoryId | "all") => {
    setShow((current) => {
      if (id === "all") return ALL;
      const onlyThis = current.size === 1 && current.has(id);
      return onlyThis ? ALL : new Set([id]);
    });
  }, []);

  // Contribute in a panel over the map. On wide screens the camera slides left so the stop stays in view.
  const contribute = useCallback(
    (quest: Quest) => {
      setPanelQuest(quest);
      const map = mapRef.current?.getMap();
      if (map && wide) map.easeTo({ padding: { top: 420, right: 460, bottom: 0, left: 0 }, duration: 600 });
    },
    [wide],
  );
  const closePanel = useCallback(() => {
    setPanelQuest(null);
    const map = mapRef.current?.getMap();
    if (map && wide) map.easeTo({ padding: { top: 420, right: 0, bottom: 0, left: 0 }, duration: 600 });
  }, [wide]);

  // The selected station's lines come forward; the rest step back.
  const selectedLineKey = selected?.lineIds.join(",") ?? "";
  const lineLayers = useMemo(() => tLineLayers(selectedLineKey ? selectedLineKey.split(",") : []), [selectedLineKey]);

  const landmarkScale = Math.min(1.4, Math.max(0.5, 0.55 + (zoom - 12) * 0.22));
  const selectedStop = selected ? stopById.get(selected.id) : undefined;
  const selectedQuests = selectedStop?.quests ?? [];

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
            onZoom={(event) => setZoom(Math.round(event.viewState.zoom * 2) / 2)}
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
            {data && <TrainsLayer trains={live?.trains ?? []} lines={data.lines} />}
            {data?.stations.map((station) => (
              <StationMarker
                key={station.id}
                station={station}
                kind={station.lineIds.length > 1 ? "hub" : "stop"}
                color={colorOfLine.get(station.lineIds[0]) ?? ""}
                selected={selected?.id === station.id}
                compact={zoom < 12}
                onSelect={selectStation}
              />
            ))}
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
            {clusters.map((cluster) =>
              cluster.stops.length > 1 ? (
                <ClusterPin key={`c-${cluster.id}`} cluster={cluster} onExpand={expandCluster} />
              ) : (
                <ProblemPin
                  key={cluster.id}
                  stop={cluster.stops[0]}
                  doneCount={cluster.stops[0].quests.filter((q) => done.has(q.id)).length}
                  selected={selected?.id === cluster.id}
                  compact={zoom < 11.5}
                  verified={verifiedOf(cluster.stops[0])}
                  onSelect={selectStop}
                />
              ),
            )}
            {data && selected && wide && (
              <ProblemTicket
                station={selected}
                lines={data.lines}
                quests={selectedQuests}
                index={Math.min(questIndex, Math.max(0, selectedQuests.length - 1))}
                onIndex={setQuestIndex}
                done={done}
                landmark={landmarkOfStation.get(selected.id)}
                docked={false}
                onContribute={contribute}
                onClose={clearSelection}
              />
            )}
          </Map>
        )}

        {/* Overlays: filters and progress under the nav, status at the bottom. */}
        <div className="pointer-events-none absolute inset-x-0 top-[3.75rem] flex flex-col gap-2 px-2 sm:top-[4.75rem] sm:flex-row sm:items-start sm:justify-between sm:px-4">
          <div className="pointer-events-auto min-w-0">
            {quests.status === "ready" && <FilterBar counts={counts} show={show} onToggle={toggleFilter} />}
          </div>
          <div className="pointer-events-auto self-start">
            <ProgressChip />
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-3 left-2 flex flex-col items-start gap-1.5 sm:left-4">
          {live && data && (!selected || wide) && (
            <StatusChip live={live.source === "live"}>
              {live.source === "live" ? content.liveChip(live.trains.length) : content.sampleChip}
            </StatusChip>
          )}
          {quests.status === "ready" && quests.source === "snapshot" && <StatusChip live={false}>{content.questsSnapshot}</StatusChip>}
          {quests.status === "failed" && <StatusChip live={false}>{content.questsFailed}</StatusChip>}
        </div>

        {!data && (
          <p className="absolute inset-x-0 bottom-6 mx-auto w-fit rounded-full border border-hairline bg-ivory px-4 py-2 font-ui text-sm text-graphite shadow-float">
            {failed ? content.error : content.loading}
          </p>
        )}

        <ContributePanel quest={panelQuest} onClose={closePanel} />

        {data && selected && !wide && !panelQuest && (
          <ProblemTicket
            station={selected}
            lines={data.lines}
            quests={selectedQuests}
            index={Math.min(questIndex, Math.max(0, selectedQuests.length - 1))}
            onIndex={setQuestIndex}
            done={done}
            landmark={landmarkOfStation.get(selected.id)}
            docked
            onContribute={contribute}
            onClose={clearSelection}
          />
        )}
      </div>
    </MotionConfig>
  );
}
