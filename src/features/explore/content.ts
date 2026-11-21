export const content = {
  title: "Explore",
  loading: "Loading the T…",
  error: "The map data did not load. Refresh to try again.",
  missionLabel: "Community Mission",
  missionNote: "Unofficial sample challenge made by T Party. Not an MBTA request.",
  progressLabel: (done: number, total: number) => `${done} of ${total} stops`,
  markDone: "Mark as completed",
  undo: "Undo",
  doneNote: "Completed in the app. Saved in this browser only.",
  close: "Close",
  /** How often train positions and elevator outages refresh, in milliseconds. */
  liveRefreshMs: 15000,
  /** How long trains take to glide to a new position. */
  liveGlideMs: 2000,
  liveChip: (trains: number) => `Live · ${trains} trains`,
  sampleChip: "Saved sample · not live",
  outageLabel: "Elevator out",
  outageSourceLive: "From the MBTA's live alerts.",
  outageSourceSample: "From a saved sample of MBTA alerts. It may be out of date.",
  outageBadge: "elevator out",
  /** Browser storage key for completed station ids. */
  storageKey: "tparty.explore.completed",
  ticket: {
    issuer: "T Party · Boston",
    number: (n: number) => `No. ${String(n).padStart(3, "0")}`,
    open: "View mission",
    stampOpen: "Open",
    stampDone: "Done",
    landmark: (name: string) => `Near ${name}`,
  },
  /** Below this zoom the landmark models are hidden, so the far-out view stays clean. */
  landmarkMinZoom: 11.5,
  landmarkPlaceholder: "Model to come",
};

/**
 * The miniature buildings. A small hand-picked set, never the whole city.
 * `art` is the picture to float over the map: a PNG with a see-through background in
 * public/assets/explore/landmarks/, drawn in three-quarter view, about 240px wide.
 * Until a landmark has `art`, a plain stand-in block shows where it will go.
 * `stationId` is the stop its mission ticket belongs to.
 */
export type Landmark = {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  stationId: string;
  art?: string;
};

export const landmarks: Landmark[] = [
  { id: "state-house", name: "State House", longitude: -71.0638, latitude: 42.3588, stationId: "place-pktrm" },
  { id: "fenway-park", name: "Fenway Park", longitude: -71.0972, latitude: 42.3467, stationId: "place-kencl" },
  { id: "public-library", name: "Boston Public Library", longitude: -71.0782, latitude: 42.3493, stationId: "place-coecl" },
  { id: "south-station", name: "South Station", longitude: -71.0552, latitude: 42.3519, stationId: "place-sstat" },
  { id: "td-garden", name: "TD Garden", longitude: -71.0621, latitude: 42.3662, stationId: "place-north" },
];

/** Placeholder challenges until the real curated ones exist. Each station gets one of these. */
export const challenges = [
  {
    title: "Elevator check",
    description: "Find the elevator or ramp at this station. Is it working, and is it easy to find?",
  },
  {
    title: "Sign spotter",
    description: "Could a first-time rider find the right platform here using only the signs?",
  },
  {
    title: "Countdown clock",
    description: "Watch the arrival board. Does the countdown match when the train really shows up?",
  },
  {
    title: "Wait in comfort",
    description: "Is there somewhere to sit and stay dry while you wait? Say what would make it better.",
  },
  {
    title: "Clean sweep",
    description: "Look around the platform and the entrance. What is one thing that needs fixing or cleaning?",
  },
];

/** Same station always gets the same challenge. A station with an elevator out gets the elevator check. */
export function challengeFor(stationId: string, hasOutage = false) {
  if (hasOutage) return challenges[0];
  let sum = 0;
  for (const char of stationId) sum += char.charCodeAt(0);
  return challenges[sum % challenges.length];
}
