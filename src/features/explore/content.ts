export const content = {
  title: "Explore",
  blurb: "Every stop on the T has a challenge. Tap a marker to see it.",
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
  liveChip: (trains: number) => `Live · ${trains} trains`,
  sampleChip: "Saved sample · not live",
  outageLabel: "Elevator out",
  outageSourceLive: "From the MBTA's live alerts.",
  outageSourceSample: "From a saved sample of MBTA alerts. It may be out of date.",
  outageBadge: "elevator out",
  /** Browser storage key for completed station ids. */
  storageKey: "tparty.explore.completed",
  /** Sprite files live in public/assets/explore/, one per line id (lowercase). */
  sprite: (lineId: string) => `/assets/explore/marker-${lineId.toLowerCase()}.png`,
  spriteSize: 20,
};

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
