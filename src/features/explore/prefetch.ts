// Starts the downloads the map needs the moment the page loads, before the (large) map code has arrived.
// The gate is on screen meanwhile, so this is where "slow" turns into "already there".
import type { QuestFeed } from "@/lib/mbta";
import type { SubwayData } from "./types";

const getJson = <T>(url: string): Promise<T> => fetch(url).then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))));

let subway: Promise<SubwayData> | null = null;
let quests: Promise<QuestFeed> | null = null;

/** The T lines and stops. Shared: asking twice returns the same download. */
export function subwayDownload() {
  subway ??= getJson<SubwayData>("/api/subway");
  return subway;
}

/** The open problems (first load only; the refresh timer fetches normally). Handed out once. */
export function takeQuestsDownload() {
  const download = (quests ??= getJson<QuestFeed>("/api/quests"));
  quests = null;
  return download;
}

/** Call once from the browser as early as possible. */
export function startPrefetch() {
  void subwayDownload().catch(() => {});
  quests ??= getJson<QuestFeed>("/api/quests");
  quests.catch(() => {});
}
