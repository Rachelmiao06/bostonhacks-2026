"use client";

import { useEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { Layer, Source, pointsToGeoJSON, setSourcePoints, trainLayer, useMap, type MapPoint } from "@/lib/map";
import { content } from "./content";
import type { LiveTrain, SubwayLine } from "./types";

type Props = { trains: LiveTrain[]; lines: SubwayLine[] };

const EMPTY = pointsToGeoJSON([]);

/**
 * Live trains as dots on the map. Each time new positions arrive, every train glides
 * from where it is drawn now to its new spot.
 */
export function TrainsLayer({ trains, lines }: Props) {
  const { current: mapRef } = useMap();
  const reduceMotion = useReducedMotion();
  const drawn = useRef(new Map<string, MapPoint>());
  const layer = useMemo(() => trainLayer(), []);

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const colorOf = new Map(lines.map((line) => [line.id, line.color]));
    const from = drawn.current;
    const to = new Map<string, MapPoint>(
      trains.map((t) => [t.id, { longitude: t.longitude, latitude: t.latitude, color: colorOf.get(t.lineId) ?? "" }]),
    );

    const draw = (progress: number) => {
      const now = new Map<string, MapPoint>();
      for (const [id, target] of to) {
        const start = from.get(id) ?? target;
        now.set(id, {
          color: target.color,
          longitude: start.longitude + (target.longitude - start.longitude) * progress,
          latitude: start.latitude + (target.latitude - start.latitude) * progress,
        });
      }
      drawn.current = now;
      setSourcePoints(map, "trains", [...now.values()]);
    };

    if (reduceMotion) {
      draw(1);
      return;
    }

    // A short glide after each update, then the map rests. Redrawing all the time kept the
    // map busy and slowed the streets down while they were still loading.
    const startedAt = performance.now();
    const timer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - startedAt) / content.liveGlideMs);
      draw(progress);
      if (progress === 1) window.clearInterval(timer);
    }, 80);
    draw(0);
    return () => window.clearInterval(timer);
  }, [mapRef, trains, lines, reduceMotion]);

  return (
    <Source id="trains" type="geojson" data={EMPTY}>
      <Layer {...layer} />
    </Source>
  );
}
