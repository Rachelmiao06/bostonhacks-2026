import { content } from "./content";
import type { ProblemStop } from "./quests";

/**
 * Why a marker is green. The source is always named, so the map never claims more than the data says:
 *  - "mbta": MBTA closed the alert (Quest.resolvedAt). The time is MBTA's.
 *  - "riders": riders said it works. The count is how many said so. Nothing is sent to MBTA.
 */
export type Verified = { source: "mbta"; at: string } | { source: "riders"; count: number };

/**
 * A stop is verified only when every problem on it is. One open problem keeps the warning colour.
 * MBTA closing an alert wins over rider reports. `riderCounts` (quest id -> riders who said it works)
 * has no live source yet, so without it only the MBTA path can show.
 */
export function verifiedOf(stop: ProblemStop, riderCounts?: ReadonlyMap<string, number>): Verified | null {
  const resolvedAt = stop.quests.map((q) => (q.mode === "verify" ? q.resolvedAt : undefined));
  if (resolvedAt.every((at): at is string => Boolean(at))) {
    return { source: "mbta", at: resolvedAt.reduce((a, b) => (new Date(a) > new Date(b) ? a : b)) };
  }
  const counts = stop.quests.map((q) => riderCounts?.get(q.id) ?? 0);
  if (counts.length > 0 && counts.every((n) => n > 0)) return { source: "riders", count: Math.max(...counts) };
  return null;
}

/** "12 min ago", "3 h ago". Verify quests are at most a day old, so nothing longer is needed. */
export function agoText(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} h ago`;
}

/** The one sentence that says where the green comes from. */
export function verifiedText(verified: Verified, now = Date.now()): string {
  return verified.source === "mbta"
    ? content.verified.mbta(agoText(verified.at, now))
    : content.verified.riders(verified.count);
}
