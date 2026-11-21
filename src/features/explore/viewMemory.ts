// Remembers where the rider was on the map (camera and selected stop) for this browser tab,
// so coming back from the island (or another page) puts them exactly where they left off.
// Session only: a new tab starts fresh. Nothing here is a reward or a score.
import type { PaddingOptions } from "maplibre-gl";

const KEY = "tparty.explore.view";

export type SavedView = {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
  padding?: PaddingOptions;
  stationId: string | null;
  questIndex: number;
};

export function loadView(): SavedView | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<SavedView>;
    const ok = [v.longitude, v.latitude, v.zoom, v.pitch, v.bearing].every((n) => typeof n === "number" && Number.isFinite(n));
    return ok ? (v as SavedView) : null;
  } catch {
    return null;
  }
}

export function saveView(patch: Partial<SavedView>) {
  try {
    // Merge into whatever is stored, even a half-filled entry (a station chosen before the camera first moved).
    const raw = window.sessionStorage.getItem(KEY);
    const current = raw ? (JSON.parse(raw) as Partial<SavedView>) : {};
    window.sessionStorage.setItem(KEY, JSON.stringify({ stationId: null, questIndex: 0, ...current, ...patch }));
  } catch {
    // storage blocked: the map just starts fresh next time
  }
}

// The explicit "rider is coming back from the island" signal. The island sets it when it is shown; the map
// reads it once on load. Together with a saved camera it skips the arrival gate. It is cleared as soon as the
// map has used it, so a later fresh visit still gets the gate and the dive. Session only.
const FROM_ISLAND_KEY = "tparty.explore.fromIsland";

export function markLeftForIsland() {
  try {
    window.sessionStorage.setItem(FROM_ISLAND_KEY, "1");
  } catch {
    // storage blocked: the rider simply sees the gate again
  }
}

/** True only when the island was visited this tab AND there is a camera to put back. */
export function isReturningFromIsland(): boolean {
  try {
    return window.sessionStorage.getItem(FROM_ISLAND_KEY) === "1" && loadView() !== null;
  } catch {
    return false;
  }
}

export function clearReturnFromIsland() {
  try {
    window.sessionStorage.removeItem(FROM_ISLAND_KEY);
  } catch {
    // nothing to clear
  }
}
