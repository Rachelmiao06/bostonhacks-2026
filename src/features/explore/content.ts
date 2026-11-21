import type { QuestKind } from "@/lib/mbta";

export const content = {
  title: "Explore",
  loading: "Unfolding the map…",
  error: "The map data did not load. Refresh to try again.",
  close: "Close",
  /** How often train positions refresh, in milliseconds. */
  liveRefreshMs: 15000,
  /** How long trains take to glide to a new position. */
  liveGlideMs: 2000,
  /** How often the list of open problems refreshes (the API caches MBTA for 5 minutes). */
  questsRefreshMs: 5 * 60 * 1000,
  liveChip: (trains: number) => `Live · ${trains} trains`,
  sampleChip: "Saved sample · not live",
  questsSnapshot: "MBTA unreachable · saved copy of alerts",
  questsFailed: "Problems could not load. The map still works.",

  filters: {
    label: "Show problems",
    all: "All",
  },

  progress: {
    label: (stamps: number, tokens: number) => `${stamps} ${stamps === 1 ? "stamp" : "stamps"} · ${tokens} tokens`,
    title: "Your collection",
  },

  cluster: (n: number) => `${n} problems here. Zoom in`,
  marker: (station: string, n: number, done: number) =>
    `${station}: ${n} ${n === 1 ? "problem" : "problems"}${done ? `, ${done} done by you` : ""}`,

  /** Green marker: always says who the status comes from. Never "fixed", never "sent to MBTA". Shown only when the data supports it (see verified.ts). */
  verified: {
    mbta: (ago: string) => `MBTA marked this working again · ${ago}`,
    riders: (n: number) => `Riders report it is working · ${n} ${n === 1 ? "rider" : "riders"}`,
    marker: (station: string, label: string) => `${station}: ${label}`,
  },

  ticket: {
    issuer: "T Party · Boston",
    number: (n: number, total: number) => `${n} of ${total}`,
    prev: "Previous problem",
    next: "Next problem",
    openFor: (days: number) => (days < 1 ? "Opened today" : days === 1 ? "Open 1 day" : `Open ${days} days`),
    failures: (n: number) => (n === 1 ? "First time out in 90 days" : `Out ${n} times in 90 days`),
    fixedAgo: "MBTA alert resolved",
    reward: (n: number) => `+${n} tokens`,
    report: "Report what you see",
    verify: "Check it’s working",
    continue: "Continue your report",
    seeYours: "See your contribution",
    source: "MBTA alert",
    unofficial: "Community mission · not an MBTA request",
    nothingHere: "No open MBTA problems listed at this stop right now.",
    landmark: (name: string) => `Near ${name}`,
    stampDone: "Done",
    stampChecked: "Checked",
  },

  panel: {
    back: "Back to the map",
    fullPage: "Open full page",
    alert: "MBTA’s alert",
    community:
      "T Party builds missions from public MBTA alerts. The MBTA did not ask for this feedback, and finishing it here sends nothing to the MBTA.",
    lines: (lines: string[]) => (lines.length ? lines.map((l) => `${l} Line`).join(" · ") : "Bus or commuter rail"),
  },

  celebrate: {
    title: "Ticket stamped",
    already: "Already in your collection",
    tokens: (n: number) => `+${n} tokens`,
    stamp: (category: string) => `${category} stamp added to your collection`,
    honest: "Completed in T Party. This does not send anything to the MBTA.",
    collection: "View collection",
    another: "Find another problem",
  },

  /** Below this zoom the landmark models are hidden, so the far-out view stays clean. */
  landmarkMinZoom: 11.5,
  landmarkPlaceholder: "Model to come",
  /** Problems within this many pixels of each other merge into one cluster. 0 = never. */
  clusterRadiusPx: (zoom: number) => (zoom >= 14.5 ? 0 : 46),
};

/**
 * Problem categories. Built only from what MBTA alerts really contain (see `Quest.kind` in src/lib/mbta.ts).
 * There is no data for cleanliness or crowding, so those are not offered.
 * Order = priority: when a stop has several problems, its pin shows the first category here.
 */
export const categories = [
  { id: "service", label: "Service changes", short: "Service", stamp: "Service" },
  { id: "access", label: "Accessibility", short: "Access", stamp: "Access" },
  { id: "station", label: "Escalators & station", short: "Station", stamp: "Station" },
  { id: "verify", label: "Check if it’s working", short: "Working?", stamp: "Verify" },
] as const;

export type CategoryId = (typeof categories)[number]["id"];

/** Report quests are filed by kind. Verify quests (MBTA resolved the alert) always go under "verify". */
export const categoryOfKind: Record<QuestKind, Exclude<CategoryId, "verify">> = {
  closure: "service",
  shuttle: "service",
  suspension: "service",
  elevator: "access",
  access: "access",
  escalator: "station",
  station: "station",
};

export const kindLabels: Record<QuestKind, string> = {
  elevator: "Elevator out",
  escalator: "Escalator out",
  access: "Access issue",
  station: "Station change",
  closure: "Station closed",
  shuttle: "Shuttle buses",
  suspension: "Service suspended",
};

/**
 * The miniature buildings. A small hand-picked set, never the whole city.
 * `art` is the picture to float over the map: a PNG with a see-through background in
 * public/assets/explore/landmarks/, drawn in three-quarter view, about 240px wide.
 * Until a landmark has `art`, a plain stand-in block shows where it will go.
 * `stationId` is the stop whose ticket opens when the landmark is tapped.
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
