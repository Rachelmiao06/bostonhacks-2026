import type { QuestKind } from "@/lib/mbta";
import type { PixelArtId } from "./PixelLandmark";

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
    issuer: "Tada · Boston",
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
      "Tada builds missions from public MBTA alerts. The MBTA did not ask for this feedback, and finishing it here sends nothing to the MBTA.",
    lines: (lines: string[]) => (lines.length ? lines.map((l) => `${l} Line`).join(" · ") : "Bus or commuter rail"),
  },

  celebrate: {
    title: "Ticket stamped",
    already: "Already in your collection",
    tokens: (n: number) => `+${n} tokens`,
    stamp: (category: string) => `${category} stamp added to your collection`,
    honest: "Completed in Tada. This does not send anything to the MBTA.",
    collection: "Visit my world",
    another: "Continue exploring",
    /** Only for the very first recorded contribution: the little world is discovered, not explained. */
    first: { title: "Your little world just grew!", body: "Your contribution added something new to your world.", keep: "Keep exploring" },
    newPiece: (name: string) => `Your island has a new piece waiting: ${name}.`,
    stampsSoFar: (n: number, total: number) => `${n} of ${total} stamps toward your island`,
  },

  /** Below this zoom the landmark models are hidden, so the far-out view stays clean. */
  landmarkMinZoom: 11,
  landmarkProblems: (name: string, n: number, done: number) =>
    `${name}: ${n} ${n === 1 ? "problem" : "problems"} at this stop${done ? `, ${done} done by you` : ""}`,
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

/** Landmarks tell local history at their real coordinates. */
export type Landmark = {
  id: PixelArtId;
  name: string;
  longitude: number;
  latitude: number;
  stationId?: string;
  story: string;
};

export const landmarks: Landmark[] = [
  {
    id: "old-state-house", name: "Old State House", longitude: -71.0575, latitude: 42.3587, stationId: "place-state",
    story: "On July 18, 1776, Bostonians gathered below this balcony for the city’s first public reading of the Declaration of Independence. Six years earlier, the Boston Massacre had taken place just outside.",
  },
  {
    id: "state-house", name: "State House", longitude: -71.0638, latitude: 42.3588, stationId: "place-pktrm",
    story: "Samuel Adams laid the cornerstone here in 1795. In 1802, Paul Revere covered the dome in copper.",
  },
  {
    id: "fenway-park", name: "Fenway Park", longitude: -71.0972, latitude: 42.3467, stationId: "place-kencl",
    story: "Rain twice delayed Fenway’s first regular-season game. On April 20, 1912, the Red Sox finally beat New York 7–6 in the eleventh inning.",
  },
  {
    id: "public-library", name: "Boston Public Library", longitude: -71.0782, latitude: 42.3493, stationId: "place-coecl",
    story: "When workers laid the cornerstone in 1888, Oliver Wendell Holmes dedicated a poem to this public library. On March 11, 1895, readers finally walked through its doors on Copley Square.",
  },
  {
    id: "south-station", name: "South Station", longitude: -71.0552, latitude: 42.3519, stationId: "place-sstat",
    story: "Boston’s railroads once dropped passengers at separate terminals across the city. On New Year’s Day in 1899, South Station opened to bring five rail lines under one roof.",
  },
  {
    id: "td-garden", name: "TD Garden", longitude: -71.0621, latitude: 42.3662, stationId: "place-north",
    story: "On June 17, 2008, Boston fans watched the Celtics defeat the Lakers in Game 6 here. The win gave the Celtics their seventeenth NBA championship.",
  },
  {
    id: "tea-party-ships", name: "Boston Tea Party Ships & Museum", longitude: -71.0512, latitude: 42.3522,
    story: "On December 16, 1773, protesters boarded three ships and threw their cargo of tea into Boston Harbor to protest a British tax. Today you can step aboard replica ships at the Congress Street Bridge.",
  },
];

/** The welcome card: the one thing a first-time rider sees, floating over the map while it loads. */
export const dive = {
  eyebrow: "Tada · Welcome aboard",
  title: "Where should we start?",
  intro: "Find T issues near you. Your location stays in your browser.",
  useLocation: "Use my location",
  locating: "Finding the nearest stop…",
  chooseStation: "Choose a station",
  skip: "Just explore the map",
  pickTitle: "Pick a station",
  search: "Search stations",
  popular: "Popular starts",
  noMatch: "No station matches that.",
  back: "Back",
  /** Why location did not work, kept calm, always with a way forward. */
  errors: {
    denied: "This site is blocked from your location. Click the lock icon in the address bar, set Location to Allow, then try again. Or choose a station.",
    system: "Your computer is not letting the browser share a location. On a Mac: System Settings, Privacy & Security, Location Services, switch your browser on. Or choose a station.",
    unavailable: "We could not work out where you are. Choose a station, or just explore the map.",
    timeout: "That took too long. Try again, choose a station, or just explore the map.",
    unsupported: "This browser cannot share a location. Choose a station instead.",
  },
  flying: "Finding problems near you…",
  waiting: "Almost there…",
  failed: "The map data did not load. Refresh to try again.",
  /** The quick picks above the station search. Each is the stop of a landmark in `landmarks`. */
  spots: [
    { label: "Park Street", stationId: "place-pktrm" },
    { label: "Kenmore · Fenway", stationId: "place-kencl" },
    { label: "South Station", stationId: "place-sstat" },
    { label: "North Station", stationId: "place-north" },
  ],
};

/** One-time hints, shown where they matter and never again. */
export const hints = {
  map: { title: "Every pin is a challenge.", body: "Tap one to explore.", dismiss: "Got it" },
  ticket: { title: "Seen this too?", body: "Share what you noticed or help verify it." },
};

/** The small 3D world around one stop, and the questions asked inside it. */
export const world = {
  near: (station: string) => `Near ${station}`,
  problems: (n: number) =>
    n === 1
      ? "1 problem within a short walk"
      : `${n} problems within a short walk`,
  far: "You are outside the T area, so we started you at Park Street.",
  quiet: (from: string) =>
    `Nothing is broken near ${from} right now. We moved you to the closest problem.`,
  legend: {
    open: "What are the pins?",
    close: "Hide",
    title: "Reading the map",
    number: "The number is how many problems are at that stop.",
    landmark: "A pixel building is a landmark near a stop. Tap it to see its problems.",
    ring: "A ring on a line is a T stop with nothing to report.",
  },
  seeCity: "See the whole city",
  backToBlock: "Back to my block",
  you: "You are here",
  question: "The question",
  asks: {
    elevator:
      "The MBTA says this elevator is out. Have you been past it? Was it running, closed off, or was there a sign?",
    escalator:
      "This escalator is listed as out of service. What did you see when you walked by?",
    access:
      "An accessibility problem is reported here. What is it like on the ground?",
    station:
      "A change is posted at this station. What do riders actually run into?",
    closure:
      "The MBTA says this stop is closed. What did you see at the entrance?",
    shuttle:
      "Shuttle buses are replacing trains here. How easy was it to find the shuttle?",
    suspension:
      "Service is suspended on this stretch. How did you find out, and what did you do?",
  } satisfies Record<QuestKind, string>,
  askVerify:
    "The MBTA says this one is fixed. Go and look: is it really working again?",
  send: "Check my answer",
  stamp: "Stamp the ticket",
  fullForm: "Add a photo in the full form",
  close: "Close",
  placeholder: "Type what you see…",
  enterHint: "Enter to check · Shift+Enter for a new line",
  coachName: "AI coach",
  edited: "You changed your answer. Check it again to unlock the stamp.",
};
