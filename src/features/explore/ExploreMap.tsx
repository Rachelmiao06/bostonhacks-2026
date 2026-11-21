"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import { MotionConfig } from "motion/react";
import type { Quest } from "@/lib/mbta";
import {
  ATLAS,
  Layer,
  MAX_BOUNDS,
  MAX_PITCH,
  MIN_ZOOM,
  Map,
  Marker,
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
import { categories, content, dive, landmarks, world as worldText, type CategoryId } from "./content";
import type { LoadStatus } from "./DiveGate";
import { MapHint } from "./Hints";
import { LandmarkMarker } from "./LandmarkMarker";
import { FilterBar, PinLegend, ProgressChip, StatusChip } from "./MapOverlays";
import { hasSeen } from "./onboarding";
import { subwayDownload } from "./prefetch";
import { ClusterPin, ProblemPin } from "./ProblemMarker";
import { verifiedOf } from "./verified";
import { ProblemTicket } from "./ProblemTicket";
import { loadView, saveView } from "./viewMemory";
import { useMyProgress } from "./progress";
import { clusterStops, problemStops, useQuests, type Cluster, type ProblemStop } from "./quests";
import { StationMarker } from "./StationMarker";
import { TrainsLayer } from "./TrainsLayer";
import type { LiveData, SubwayData, SubwayStation } from "./types";
import { AtlasButton, Eyebrow } from "./ui";
import { WorldQuest } from "./WorldQuest";
import {
  overviewView,
  chooseWorld,
  distanceM,
  flyCamera,
  insideWorld,
  leash,
  prefersReducedMotion,
  setWorldBuildingsOpacity,
  showWorldBuildings,
  worldView,
  type CameraView,
  type Entry,
  type World,
} from "./world";

type MapStyle = Awaited<ReturnType<typeof loadMapStyle>>;

const getJson = <T,>(url: string): Promise<T> =>
  fetch(url).then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))));

// The streets start downloading the moment this file arrives in the browser, before React has drawn anything.
// The T lines and the problem list were already started by prefetch.ts, as soon as the page loaded.
const stylePromise = loadMapStyle();
const subwayPromise = subwayDownload();
const BUILDING_OPACITY = 0.92;
const DIVE_SECONDS = 4.2;

const landmarkOfStation = new globalThis.Map(landmarks.filter((landmark) => landmark.stationId).map((landmark) => [landmark.stationId, landmark]));

/**
 * PROTOTYPE: soft haze toward the horizon when the map is tilted, in the atlas palette.
 * Uses MapLibre's own sky settings: no extra layer, no full-screen filter.
 */
function addHaze(map: Parameters<typeof addStickerLayers>[0]) {
  map.setSky({
    "sky-color": ATLAS.road,
    "horizon-color": ATLAS.land,
    "fog-color": ATLAS.land,
    "sky-horizon-blend": 0.6,
    "horizon-fog-blend": 0.7,
    "fog-ground-blend": 0.6,
    "atmosphere-blend": 0,
  });
}
const ALL = new Set<CategoryId>(categories.map((c) => c.id));
const NOTHING_DONE: ReadonlySet<string> = new Set();
/** The camera the map opens on behind the gate (Boston from high above). */
function openingView() {
  const view = overviewView(window.innerWidth < 640);
  return { longitude: view.center[0], latitude: view.center[1], zoom: view.zoom, pitch: view.pitch, bearing: view.bearing };
}
type Mode = "intro" | "world" | "atlas";
const lngLat = (s: SubwayStation): [number, number] => [s.longitude, s.latitude];

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
type Props = {
  /** How the rider chose to start (from the gate). */
  entry: Entry;
  /** Reports what has finished loading, for the gate's checklist. */
  onStatus: (status: LoadStatus) => void;
  /** Called when the gate can lift because the camera is about to move. */
  onReveal: () => void;
  /** This visit began with the welcome and a chosen starting place: the one-time map hint may show. */
  guided?: boolean;
};

export default function ExploreMap({ entry, onStatus, onReveal, guided = false }: Props) {
  const mapRef = useRef<MapRef>(null);
  const wide = useWide();
  // intro = hidden behind the gate; world = the small 3D district; atlas = the whole city (the original map).
  const [mode, setMode] = useState<Mode>(entry.kind === "atlas" ? "atlas" : "intro");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [patient, setPatient] = useState(false);
  const [worldInfo, setWorldInfo] = useState<World | null>(null);
  const [arrived, setArrived] = useState(false);
  // The one-time map hint: decided when the rider arrives, put away on their first interaction.
  const [hintGone, setHintGone] = useState(false);
  const [hintAllowed] = useState(() => typeof window !== "undefined" && !hasSeen("mapHint"));
  const fogRef = useRef<HTMLDivElement>(null);
  const flight = useRef<gsap.core.Timeline | null>(null);
  const unleash = useRef<(() => void) | null>(null);
  const started = useRef(false);
  const [startsInAtlas] = useState(entry.kind === "atlas");
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  });
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
  // Back from another page: the camera starts where the rider left it (see viewMemory.ts).
  const [startView] = useState(() => {
    const saved = loadView();
    return saved ? { longitude: saved.longitude, latitude: saved.latitude, zoom: saved.zoom, pitch: saved.pitch, bearing: saved.bearing, padding: saved.padding } : initialView();
  });
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
  // Not while the gate is up: the first seconds belong to the map and the dive.
  useEffect(() => {
    if (mode === "intro") return;
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
  }, [mode]);

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

  // The small world only shows what is inside its circle: a handful of stops, not the whole T.
  const allStops = useMemo(() => problemStops(questList, stationById, ALL), [questList, stationById]);
  const worldStops = useMemo(
    () => (worldInfo ? allStops.filter((stop) => insideWorld(worldInfo.center, lngLat(stop.station), 1.05)) : []),
    [allStops, worldInfo],
  );
  const worldStationList = useMemo(
    () => (worldInfo && data ? data.stations.filter((station) => insideWorld(worldInfo.center, lngLat(station), 1.05)) : []),
    [data, worldInfo],
  );
  // Scenery is anchored to the building, which can be a few blocks from its station.
  const districtLandmarks = useMemo(
    () => worldInfo ? landmarks.filter(l => insideWorld(worldInfo.center, [l.longitude, l.latitude], 1.05)) : [],
    [worldInfo],
  );
  // The hint points at one open challenge pin near the middle of the little world. Only pins that are really
  // open qualify: not one that is verified (it carries its own label) and not one the rider has finished.
  // MapHint then keeps only a pin that is on screen and has a clear side to sit on.
  const hintCandidates = useMemo(() => {
    if (!worldInfo) return [];
    return worldStops
      .filter((stop) => !verifiedOf(stop) && !stop.quests.every((q) => done.has(q.id)))
      .map((stop) => ({ stop, d: distanceM(worldInfo.center, [stop.station.longitude, stop.station.latitude]) }))
      .sort((x, y) => x.d - y.d)
      .map(({ stop }) => [stop.station.longitude, stop.station.latitude] as [number, number]);
  }, [worldInfo, worldStops, done]);
  // Every marker the callout must stay off: all problem pins and the pixel landmarks.
  const hintOthers = useMemo(() => {
    const spots: [number, number][] = worldStops.map((stop) => [stop.station.longitude, stop.station.latitude]);
    for (const landmark of districtLandmarks) spots.push([landmark.longitude, landmark.latitude]);
    return spots;
  }, [worldStops, districtLandmarks]);
  const showHint = guided && hintAllowed && !hintGone && mode === "world" && arrived && !selected && !panelQuest && hintCandidates.length > 0;

  const worldProblemCount = worldStops.reduce((sum, stop) => sum + stop.quests.length, 0);

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
      if (mode === "world") {
        // The question card sits at the bottom: lift the stop above it and lean in.
        map.flyTo({
          center: [station.longitude, station.latitude],
          zoom: wide ? 16.8 : 16.4,
          pitch: 64,
          // Top room keeps the pin clear of the floating nav.
          padding: wide ? { top: 90, bottom: 340, left: 0, right: 0 } : { top: 120, bottom: 430, left: 0, right: 0 },
          duration: 1000,
        });
        return;
      }
      // Wide: the ticket stands above the stop, under the nav and filters. Phone: it docks at the bottom.
      map.flyTo({
        center: [station.longitude, station.latitude],
        zoom: Math.max(map.getZoom(), wide ? 14.3 : 14),
        pitch: wide ? 58 : 50,
        padding: wide ? { top: 420, bottom: 0, left: 0, right: 0 } : { top: 120, bottom: 340, left: 0, right: 0 },
        duration: 1200,
      });
    },
    [wide, mode],
  );

  // A stop or cluster on the opening map is also a way into the atlas.
  const enterFromMarker = useCallback(() => {
    if (mode !== "intro" || started.current || entry.kind !== "pending") return;
    started.current = true;
    setMode("atlas");
    onReveal();
  }, [mode, entry.kind, onReveal]);

  const selectStation = useCallback(
    (station: SubwayStation, index = 0) => {
      enterFromMarker();
      setSelected(station);
      setQuestIndex(index);
      saveView({ stationId: station.id, questIndex: index });
      focus(station);
    },
    [enterFromMarker, focus],
  );

  const selectStop = useCallback((stop: ProblemStop) => selectStation(stop.station), [selectStation]);

  const expandCluster = useCallback((cluster: Cluster) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    enterFromMarker();
    const lons = cluster.stops.map((s) => s.station.longitude);
    const lats = cluster.stops.map((s) => s.station.latitude);
    map.fitBounds(
      [
        [Math.min(...lons), Math.min(...lats)],
        [Math.max(...lons), Math.max(...lats)],
      ],
      { padding: 120, maxZoom: 15, duration: 900 },
    );
  }, [enterFromMarker]);

  const clearSelection = useCallback(() => {
    setSelected(null);
    saveView({ stationId: null, questIndex: 0 });
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (mode === "world" && worldInfo) {
      // Back out to the whole district instead of staying nose-to-glass with one building.
      const view = worldView(worldInfo.center, !wide);
      map.easeTo({ center: view.center, zoom: view.zoom, pitch: view.pitch, padding: { top: 0, right: 0, bottom: 0, left: 0 }, duration: 900 });
    } else clearCameraPadding(map);
  }, [mode, worldInfo, wide]);

  // Next keeps this page mounted but hidden while the rider is on another page, and a hidden map loses its camera.
  // Effects run again when the page is shown, so put the camera back exactly where it was left.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = loadView();
      const map = mapRef.current?.getMap();
      // Only the regular map is remembered; the gate and the dive into the 3D district run their own camera.
      if (!saved || !map || modeRef.current !== "atlas") return;
      map.resize();
      map.jumpTo({ center: [saved.longitude, saved.latitude], zoom: saved.zoom, pitch: saved.pitch, bearing: saved.bearing, ...(saved.padding ? { padding: saved.padding } : {}) });
    }, 60);
    return () => window.clearTimeout(timer);
  }, []);

  // Back from another page: bring back the selected stop's ticket without moving the camera.
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current || !style || !data || !startsInAtlas) return;
    restored.current = true;
    if (new URLSearchParams(window.location.search).get("quest")) return; // a deep link wins
    const saved = loadView();
    const station = saved?.stationId ? stationById.get(saved.stationId) : undefined;
    if (!station) return;
    // Wait a frame so the map has mounted (same as the deep link below).
    requestAnimationFrame(() => {
      setSelected(station);
      setQuestIndex(saved?.questIndex ?? 0);
      const map = mapRef.current?.getMap();
      if (map) map.jumpTo({ padding: wide ? { top: 420, bottom: 0, left: 0, right: 0 } : { top: 120, bottom: 340, left: 0, right: 0 } });
    });
  }, [style, data, stationById, wide, startsInAtlas]);

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
      const top = mode === "world" ? 0 : 420;
      if (map && wide) map.easeTo({ padding: { top, right: 460, bottom: 0, left: 0 }, duration: 600 });
    },
    [wide, mode],
  );
  const closePanel = useCallback(() => {
    setPanelQuest(null);
    const map = mapRef.current?.getMap();
    // In the world the question card comes back for the same stop, so keep room for it.
    if (map && wide) map.easeTo({ padding: mode === "world" ? { top: 90, right: 0, bottom: 340, left: 0 } : { top: 420, right: 0, bottom: 0, left: 0 }, duration: 600 });
  }, [wide, mode]);

  // ---- The dive: gate -> fall from above Boston -> a small 3D world around one stop ----

  const atlasView = useCallback((): CameraView => {
    const view = initialView();
    return { center: [view.longitude, view.latitude], zoom: view.zoom, pitch: view.pitch, bearing: view.bearing };
  }, []);

  /** Falls from high above the city to the district and builds the world while falling. */
  const playWorld = useCallback(
    (map: ReturnType<NonNullable<MapRef["getMap"]>>, w: World) => {
      unleash.current?.();
      unleash.current = null;
      flight.current?.kill();
      setWorldInfo(w);
      setMode("world");
      setArrived(false);
      showWorldBuildings(map, w.center);
      const fog = fogRef.current;
      const buildings = { v: 0 };
      const settle = () => {
        map.setMinZoom(14.6);
        gsap.set(fog, { opacity: 1 });
        setWorldBuildingsOpacity(map, BUILDING_OPACITY);
        unleash.current = leash(map, w.center);
        setArrived(true);
      };
      flight.current = flyCamera(map, worldView(w.center, !wide), {
        duration: DIVE_SECONDS,
        instant: prefersReducedMotion(),
        decorate: (timeline) => {
          // In the last seconds of the fall: the fog closes in around the district and the buildings rise.
          timeline.fromTo(fog, { opacity: 0 }, { opacity: 1, duration: 1.5, ease: "power1.inOut" }, DIVE_SECONDS - 1.8);
          timeline.to(buildings, { v: BUILDING_OPACITY, duration: 1.4, ease: "power1.out", onUpdate: () => setWorldBuildingsOpacity(map, buildings.v) }, DIVE_SECONDS - 1.6);
        },
        onComplete: settle,
      });
    },
    [wide],
  );

  /** The whole city, as the map always was. */
  const playAtlas = useCallback(
    (map: ReturnType<NonNullable<MapRef["getMap"]>>) => {
      unleash.current?.();
      unleash.current = null;
      flight.current?.kill();
      setArrived(false);
      setSelected(null);
      setPanelQuest(null);
      map.setMinZoom(MIN_ZOOM);
      const buildings = { v: BUILDING_OPACITY };
      flight.current = flyCamera(map, atlasView(), {
        duration: 2.4,
        instant: prefersReducedMotion(),
        decorate: (timeline) => {
          timeline.to(fogRef.current, { opacity: 0, duration: 0.9 }, 0);
          timeline.to(buildings, { v: 0, duration: 1.1, onUpdate: () => setWorldBuildingsOpacity(map, buildings.v) }, 0);
        },
        onComplete: () => {
          gsap.set(fogRef.current, { opacity: 0 });
          setWorldBuildingsOpacity(map, 0);
          // The city's markers appear only once the camera has settled, so nothing pops in mid-flight.
          setMode("atlas");
        },
      });
    },
    [atlasView],
  );

  // The gate's checklist.
  const problemsReady = quests.status !== "loading";
  useEffect(() => {
    onStatus({ streets: Boolean(style) && mapLoaded, lines: Boolean(data), problems: problemsReady, failed });
  }, [onStatus, style, mapLoaded, data, problemsReady, failed]);

  // If the problem list is slow, start without waiting for it forever.
  const chose = entry.kind !== "pending";
  useEffect(() => {
    if (!chose) return;
    const timer = window.setTimeout(() => setPatient(true), 7000);
    return () => window.clearTimeout(timer);
  }, [chose]);

  // Once the rider has chosen and the map is ready: lift the gate and start moving.
  useEffect(() => {
    if (started.current || entry.kind === "pending" || !style || !mapLoaded || !data) return;
    if (quests.status === "loading" && !patient) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    started.current = true;
    onReveal();
    if (entry.kind === "atlas") {
      if (!startsInAtlas) playAtlas(map);
      return;
    }
    playWorld(map, chooseWorld(entry, data.stations, allStops));
  }, [entry, style, mapLoaded, data, quests.status, patient, allStops, onReveal, playWorld, playAtlas, startsInAtlas]);

  const backToBlock = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map && worldInfo) playWorld(map, worldInfo);
  }, [playWorld, worldInfo]);
  const seeCity = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) playAtlas(map);
  }, [playAtlas]);

  // Leaving the page mid-flight: stop the animation and the leash.
  useEffect(
    () => () => {
      flight.current?.kill();
      unleash.current?.();
    },
    [],
  );

  // The selected station's lines come forward; the rest step back.
  const selectedLineKey = selected?.lineIds.join(",") ?? "";
  const lineLayers = useMemo(() => tLineLayers(selectedLineKey ? selectedLineKey.split(",") : []), [selectedLineKey]);

  const landmarkScale = Math.min(1.4, Math.max(0.5, 0.55 + (zoom - 12) * 0.22));
  const showLandmarks = zoom >= content.landmarkMinZoom;
  const selectedStop = selected ? stopById.get(selected.id) : undefined;
  const selectedQuests = selectedStop?.quests ?? [];

  return (
    <MotionConfig reducedMotion="user">
      <div className="fixed inset-0 z-30" style={{ ...atlasCssVars, backgroundColor: "var(--atlas-land)" }}>
        {style && (
          <Map
            ref={mapRef}
            initialViewState={startsInAtlas ? startView : openingView()}
            attributionControl={{ compact: true }}
            mapStyle={style}
            maxBounds={MAX_BOUNDS}
            maxPitch={MAX_PITCH}
            minZoom={MIN_ZOOM}
            style={{ width: "100%", height: "100%" }}
            onLoad={(event) => {
              addStickerLayers(event.target);
              setMapLoaded(true);
              addHaze(event.target);
            }}
            onZoom={(event) => setZoom(Math.round(event.viewState.zoom * 2) / 2)}
            onMoveEnd={(event) => {
              // A hidden map (the rider is on another page) is 0 px wide and its camera is meaningless: never save that.
              if (event.target.getContainer().clientWidth === 0 || modeRef.current !== "atlas") return;
              const { longitude, latitude, zoom: z, pitch, bearing, padding } = event.viewState;
              saveView({ longitude, latitude, zoom: z, pitch, bearing, padding });
            }}
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
            {data && (mode === "atlas" || arrived) && <TrainsLayer trains={live?.trains ?? []} lines={data.lines} />}
            {(mode === "world" ? worldStationList : data?.stations)?.map((station) => (
              <StationMarker
                key={station.id}
                station={station}
                kind={station.lineIds.length > 1 ? "hub" : "stop"}
                color={colorOfLine.get(station.lineIds[0]) ?? ""}
                selected={selected?.id === station.id}
                compact={zoom < 12}
                onSelect={(picked) => {
                  if (mode !== "world") return selectStation(picked);
                  // In the world only stops with a problem lead anywhere.
                  const stop = stopById.get(picked.id) ?? allStops.find((s) => s.station.id === picked.id);
                  if (stop) selectStop(stop);
                }}
              />
            ))}
            {data &&
              (mode !== "atlas" || showLandmarks) &&
              (mode === "world" ? districtLandmarks : landmarks)
                .map((landmark) => (
                <LandmarkMarker
                  key={landmark.id}
                  landmark={landmark}
                  scale={landmarkScale}
                />
              ))}
            {mode !== "world" &&
              clusters.map((cluster) =>
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
            {mode === "world" &&
              worldStops
                .map((stop) => (
                <ProblemPin
                  key={stop.station.id}
                  stop={stop}
                  doneCount={stop.quests.filter((q) => done.has(q.id)).length}
                  selected={selected?.id === stop.station.id}
                  compact={false}
                  beacon
                  verified={verifiedOf(stop)}
                  onSelect={selectStop}
                />
              ))}
            {showHint && <MapHint candidates={hintCandidates} others={hintOthers} onGone={() => setHintGone(true)} onNone={() => setHintGone(true)} />}
            {mode === "world" && arrived && worldInfo?.you && (
              <Marker longitude={worldInfo.you[0]} latitude={worldInfo.you[1]} anchor="center" style={{ zIndex: 7 }}>
                <span role="img" aria-label={worldText.you} title={worldText.you} className="relative block size-4">
                  <span aria-hidden className="absolute inset-0 rounded-full bg-graphite/30 motion-safe:animate-ping" />
                  <span className="absolute inset-0 rounded-full border-2 border-ivory bg-graphite shadow-float" />
                </span>
              </Marker>
            )}
            {data && selected && wide && mode === "atlas" && (
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

        {/* The fog: the edge of the small world fades into the city's own colour, like a diorama on a table. */}
        <div
          ref={fogRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0"
          style={{ background: "radial-gradient(ellipse 64% 60% at 50% 52%, transparent 52%, color-mix(in oklab, var(--atlas-land) 60%, transparent) 76%, var(--atlas-land) 100%)" }}
        />

        {/* Overlays under the nav: the filters (city) or the name tag (world) on the left; the way out and progress on the right. */}
        <div className="pointer-events-none absolute inset-x-0 top-[3.75rem] flex flex-col gap-2 px-2 sm:top-[4.75rem] sm:flex-row sm:items-start sm:justify-between sm:px-4">
          <div className="pointer-events-auto min-w-0">
            {mode === "atlas" && quests.status === "ready" && <FilterBar counts={counts} show={show} onToggle={toggleFilter} />}
            {mode === "world" && arrived && worldInfo && (
              <div aria-live="polite" className="max-w-72 rounded-2xl border border-hairline bg-ivory/92 px-3.5 py-2 shadow-float backdrop-blur-md">
                <Eyebrow>{worldText.near(worldInfo.station.name)}</Eyebrow>
                <p className="font-ui text-sm font-medium text-graphite">{worldText.problems(worldProblemCount)}</p>
                {worldInfo.note && <p className="mt-1 font-ui text-xs text-taupe">{worldInfo.note.kind === "far" ? worldText.far : worldText.quiet(worldInfo.note.from)}</p>}
              </div>
            )}
          </div>
          <div className="pointer-events-auto flex items-center gap-2 self-start">
            {mode === "atlas" && worldInfo && (
              <AtlasButton tone="outline" size="sm" className="shadow-float" onClick={backToBlock}>
                {worldText.backToBlock}
              </AtlasButton>
            )}
            {mode === "world" && arrived && (
              <AtlasButton tone="outline" size="sm" className="shadow-float" onClick={seeCity}>
                {worldText.seeCity}
              </AtlasButton>
            )}
            {mode !== "intro" && <ProgressChip />}
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-3 left-2 flex flex-col items-start gap-1.5 sm:left-4">
          {mode === "atlas" && live && data && (!selected || wide) && (
            <StatusChip live={live.source === "live"}>
              {live.source === "live" ? content.liveChip(live.trains.length) : content.sampleChip}
            </StatusChip>
          )}
          {mode === "world" && !arrived && <StatusChip live>{dive.flying}</StatusChip>}
          {mode !== "intro" && arrived && !selected && !panelQuest && !showHint && quests.status === "ready" && <PinLegend />}
          {quests.status === "ready" && quests.source === "snapshot" && <StatusChip live={false}>{content.questsSnapshot}</StatusChip>}
          {quests.status === "failed" && <StatusChip live={false}>{content.questsFailed}</StatusChip>}
        </div>

        {!data && mode !== "intro" && (
          <p className="absolute inset-x-0 bottom-6 mx-auto w-fit rounded-full border border-hairline bg-ivory px-4 py-2 font-ui text-sm text-graphite shadow-float">
            {failed ? content.error : content.loading}
          </p>
        )}

        <ContributePanel quest={panelQuest} onClose={closePanel} />

        {mode === "world" && arrived && selected && !panelQuest && selectedQuests.length > 0 && (
          <WorldQuest
            key={selected.id}
            quests={selectedQuests}
            index={Math.min(questIndex, selectedQuests.length - 1)}
            onIndex={setQuestIndex}
            onClose={clearSelection}
            onFullForm={contribute}
          />
        )}

        {mode === "atlas" && data && selected && !wide && !panelQuest && (
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
