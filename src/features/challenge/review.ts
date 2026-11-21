import { settings } from "./content";
import type { Quest } from "./sample-quests";

export type Check = { ok: boolean; note: string };

export type ReviewResult = {
  status: "needs_revision" | "reviewed";
  relevance: Check;
  specificity: Check;
  completeness: Check;
  /** null when no photo was added */
  photo: Check | null;
  suggestions: string[];
  /** "practice" = offline stand-in. Later: "ai". */
  source: "practice" | "ai";
};

export type ReviewInput = { quest: Quest; text: string; hasPhoto: boolean };

const TOPIC_WORDS = [
  "elevator", "escalator", "stairs", "accessib", "wheelchair", "stroller", "mobility",
  "out of service", "broken", "outage", "lift", "ramp", "platform", "lobby",
];
const DETAIL_WORDS = [
  "today", "yesterday", "morning", "evening", "night", "monday", "tuesday", "wednesday",
  "thursday", "friday", "saturday", "sunday", "am", "pm", "week", "days", "platform",
  "lobby", "entrance", "gate", "level", "inbound", "outbound", "stairs",
];
const IMPACT_WORDS = [
  "because", "so i", "had to", "unable", "couldn't", "could not", "stuck", "late", "wait",
  "need", "should", "please", "would like", "hard", "difficult", "bike", "bags", "stroller",
  "wheelchair", "carry",
];

function includesAny(haystack: string, words: string[]) {
  return words.some((w) => haystack.includes(w));
}

/**
 * Offline stand-in for the AI coach, so the flow can be tested without keys.
 * It only looks at the text. It cannot look at photos and says so.
 * Replace with a call to /api/review (Gemini) when that route exists.
 */
export async function reviewDraft({ quest, text, hasPhoto }: ReviewInput): Promise<ReviewResult> {
  await new Promise((r) => setTimeout(r, settings.practiceReviewDelayMs));

  const t = text.trim().toLowerCase();
  const words = t.split(/\s+/).filter(Boolean);
  const hasText = words.length > 0;

  const stationHit = quest.stationName
    .toLowerCase()
    .split(/\s+/)
    .some((w) => w.length > 3 && t.includes(w));
  const relevant = hasText && (stationHit || includesAny(t, TOPIC_WORDS) || t.includes(quest.kind));

  const detailSignals =
    Number(/\d/.test(t)) + Number(includesAny(t, DETAIL_WORDS)) + Number(words.length >= 15);
  const specific = hasText && detailSignals >= 2;

  const complete = words.length >= 15 && includesAny(t, IMPACT_WORDS);

  const relevance: Check = !hasText
    ? { ok: false, note: "Add a sentence so the coach can tell what this is about." }
    : relevant
      ? { ok: true, note: "This reads as being about the quest." }
      : { ok: false, note: `Mention the ${quest.kind} or ${quest.stationName} so it is clear what you are writing about.` };

  const specificity: Check = specific
    ? { ok: true, note: "Includes concrete details a planner could use." }
    : { ok: false, note: "Add details: when it happened, where in the station, and what you saw." };

  const completeness: Check = complete
    ? { ok: true, note: "The problem and its effect on you are clear." }
    : { ok: false, note: "Explain how it affected you and what you would like to change." };

  const photo: Check | null = hasPhoto
    ? hasText
      ? { ok: true, note: "Photo added. The practice coach cannot look at it, and a photo is never treated as proof." }
      : { ok: false, note: "Add a sentence describing what the photo shows and where it was taken." }
    : null;

  const suggestions = [relevance, specificity, completeness, photo]
    .filter((c): c is Check => c !== null && !c.ok)
    .map((c) => c.note);

  return {
    status: suggestions.length === 0 ? "reviewed" : "needs_revision",
    relevance,
    specificity,
    completeness,
    photo,
    suggestions,
    source: "practice",
  };
}
