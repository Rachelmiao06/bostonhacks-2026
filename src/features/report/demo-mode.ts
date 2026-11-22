// Demo mode for presenting without a street problem in front of you. Turned on by opening /report?demo=1 (off with ?demo=0).
// It changes two things only: a photo OF a picture or screen is judged by what the picture shows, and a missing,
// imprecise or non-Boston GPS reading is replaced by one fixed Boston spot. Sending is simulated either way.
// Normal visitors never get it: the page says "Demo mode" on screen while it is on.
const KEY = "tada-report-demo";

/** A fixed public street spot in Boston (Kenmore area) where real open 311 cases exist, so the duplicate check has something to show. */
export const DEMO_SPOT = { lat: 42.34463, lng: -71.10056, accuracy: 10 };

const inBoston = (lat: number, lng: number) => lat >= 42.2279 && lat <= 42.3997 && lng >= -71.1912 && lng <= -70.986;

export function demoOn(): boolean {
  if (typeof window === "undefined") return false;
  const q = new URLSearchParams(window.location.search).get("demo");
  try {
    if (q === "1") sessionStorage.setItem(KEY, "1");
    if (q === "0") sessionStorage.removeItem(KEY);
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return q === "1";
  }
}

/** The real reading if it is usable, otherwise the fixed demo spot. */
export function demoFix<T extends { lat: number; lng: number; accuracy: number }>(at: T | null) {
  return at && at.accuracy <= 50 && inBoston(at.lat, at.lng) ? at : DEMO_SPOT;
}
