// Which open community missions to suggest after Snap decides a photo is an MBTA matter.
// Pure functions only (no fetching, no React), so the matching rules are easy to read and test.
//
// Two signals, kept apart on purpose:
//   - Proximity: how far the photo was taken from a station the mission is about.
//   - Relevance: whether the AI's own words about the photo mention what the mission is about.
// A mission is a "possible match" only with BOTH. Anything else that is close by is "other nearby":
// we never imply it is the same problem. The AI only guesses; nothing here confirms a fact.
import type { Quest, QuestKind } from "@/lib/mbta";
import type { CheckResult } from "./types";

export type Place = { id: string; lat: number; lon: number };
export type MissionPick = { quest: Quest; distanceM: number };
export type MissionSuggestions = { matches: MissionPick[]; others: MissionPick[] };

/** A possible match must be this close to a station the mission is about. */
export const MATCH_RADIUS_M = 400;
/** "Other nearby" missions may be a little further away. */
export const NEARBY_RADIUS_M = 800;
/** The most missions we show in total, so the card stays short on a phone. */
export const MAX_SHOWN = 3;

/** Words in the AI's description that point at each kind of mission. Deliberately narrow: a wrong "match" is worse than none. */
const WORDS: Record<QuestKind, RegExp> = {
  elevator: /\b(elevators?|lifts?)\b/i,
  escalator: /\bescalators?\b/i,
  access: /\b(accessib\w*|wheelchair|ramp|ada)\b/i,
  station: /\b(stairs?|stairway|platform|entrance|exit|turnstiles?|fare ?gates?|doorway)\b/i,
  closure: /\b(station (is )?closed|closed station|closure)\b/i,
  shuttle: /\bshuttle\b/i,
  suspension: /\b(no service|suspended|suspension)\b/i,
};

/** Plain names for the kind of mission, used on the cards. */
export const KIND_NAMES: Record<QuestKind, string> = {
  elevator: "Elevator",
  escalator: "Escalator",
  access: "Accessibility",
  station: "Station issue",
  closure: "Station closure",
  shuttle: "Shuttle buses",
  suspension: "Service suspended",
};

/** Straight-line distance in metres (haversine). Plenty accurate at city scale. */
export function distanceM(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(bLat - aLat) / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLng - aLng) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

/** Everything the AI said about the photo, as one string to look for words in. */
export const describe = (r: Pick<CheckResult, "headline" | "explanation" | "reason" | "description">) =>
  [r.headline, r.explanation, r.reason, r.description].filter(Boolean).join(" ");

export function isRelevant(kind: QuestKind, aiText: string) {
  return WORDS[kind].test(aiText);
}

/**
 * Open "report" missions near the photo, split into possible matches and others.
 * Verify missions are left out (they confirm a repair, they do not match a problem photo),
 * and so are alerts that are not active right now.
 */
export function suggestMissions(input: { lat: number; lng: number; aiText: string; quests: Quest[]; places: Place[] }): MissionSuggestions {
  const { lat, lng, aiText, quests, places } = input;
  const at = new Map(places.map((p) => [p.id, distanceM(lat, lng, p.lat, p.lon)]));

  // For each mission, the distance to its nearest affected station (shuttles and suspensions cover several).
  const picks: MissionPick[] = [];
  for (const quest of quests) {
    if (quest.mode !== "report" || quest.status !== "open" || !quest.activeNow) continue;
    const ids = quest.stationIds.length ? quest.stationIds : quest.stationId ? [quest.stationId] : [];
    const dist = Math.min(...ids.map((id) => at.get(id) ?? Infinity));
    if (dist <= NEARBY_RADIUS_M) picks.push({ quest, distanceM: Math.round(dist) });
  }
  picks.sort((a, b) => a.distanceM - b.distanceM);

  const matches = picks.filter((p) => p.distanceM <= MATCH_RADIUS_M && isRelevant(p.quest.kind, aiText)).slice(0, 2);
  const matched = new Set(matches.map((m) => m.quest.id));
  const others = picks.filter((p) => !matched.has(p.quest.id)).slice(0, Math.max(0, MAX_SHOWN - matches.length));

  return { matches, others };
}
