"use client";

import { useCallback, useEffect, useState } from "react";
import { sampleStats } from "./sample";
import type { StatsResponse } from "./types";

export type StatsState =
  | { kind: "loading" }
  | { kind: "live"; data: StatsResponse }
  /** The API is missing (404) or the database is not connected (503): show sample numbers, labelled. */
  | { kind: "sample"; data: StatsResponse; reason: "no_api" | "no_database" }
  /** A real failure. Never replaced by sample numbers. */
  | { kind: "error"; message: string };

function looksLikeStats(value: unknown): value is StatsResponse {
  const v = value as Partial<StatsResponse> | null;
  return !!v && typeof v === "object" && !!v.outages && !!v.riders && !!v.dataNotes;
}

/** Loads /api/stats. All the "what do we show when it is not available" rules live here. */
export function useStats() {
  const [state, setState] = useState<StatsState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/stats", { signal: controller.signal });
        if (res.status === 404) return setState({ kind: "sample", data: sampleStats, reason: "no_api" });
        if (res.status === 503) return setState({ kind: "sample", data: sampleStats, reason: "no_database" });
        if (!res.ok) return setState({ kind: "error", message: `The stats service answered with an error (${res.status}).` });
        const json: unknown = await res.json();
        if (!looksLikeStats(json)) return setState({ kind: "error", message: "The stats service sent data we did not expect." });
        setState({ kind: "live", data: json });
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setState({ kind: "error", message: "We could not reach the stats service." });
      }
    })();
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ kind: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
}
