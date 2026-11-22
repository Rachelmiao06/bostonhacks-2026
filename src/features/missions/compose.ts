import type { Quest } from "@/lib/mbta";
import { locationOf, templateFor, type StatusOption } from "./templates";

/** What the rider chose. Everything the update says comes from here and from the verified alert, nothing else. */
export type Answers = {
  when: "now" | "earlier" | "not_yet" | null;
  /** ISO time taken from the device clock when the rider said "I'm at the station now". */
  observedAt: string | null;
  earlier: "today" | "yesterday" | "week" | null;
  status: string | null;
  note: string;
  /** The one follow-up answer, when the AI asked for it. */
  extra: string;
};

export const EMPTY_ANSWERS: Answers = { when: null, observedAt: null, earlier: null, status: null, note: "", extra: "" };

export const EARLIER_LABELS: Record<NonNullable<Answers["earlier"]>, string> = {
  today: "Earlier today",
  yesterday: "Yesterday",
  week: "Earlier this week",
};

/** Can the rider move on from the "when" step with a first-hand observation? "Haven't checked" can never submit. */
export function whenIsFirstHand(a: Answers) {
  return a.when === "now" || (a.when === "earlier" && a.earlier !== null);
}

export type Summary = {
  title: string;
  place: string;
  unit: string | null;
  status: string;
  statusSentence: string;
  tone: StatusOption["tone"];
  when: string;
  note: string | null;
  extra: string | null;
  hasPhoto: boolean;
};

const clock = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

export function whenText(a: Answers) {
  if (a.when === "now") return a.observedAt ? `At the station, ${clock.format(new Date(a.observedAt))}` : "At the station";
  if (a.when === "earlier" && a.earlier) return EARLIER_LABELS[a.earlier];
  return "";
}

export function buildSummary(quest: Quest, a: Answers, hasPhoto: boolean): Summary | null {
  const template = templateFor(quest);
  const option = template.options.find((o) => o.id === a.status);
  if (!option || !whenIsFirstHand(a)) return null;
  const where = locationOf(quest);
  return {
    title: template.title,
    place: quest.stationName,
    unit: where.primary === quest.stationName ? null : where.primary.slice(quest.stationName.length + 3),
    status: option.label,
    statusSentence: option.sentence,
    tone: option.tone,
    when: whenText(a),
    note: a.note.trim() || null,
    extra: a.extra.trim() || null,
    hasPhoto,
  };
}

/**
 * The text that goes to the existing review and submission routes. Built only from the rider's answers,
 * so it can never contain a date, an observation or a photo the rider did not give.
 */
export function submissionText(s: Summary) {
  return [
    "Community observation from a rider (not an official MBTA report).",
    `Place: ${s.place}${s.unit ? `, ${s.unit}` : ""}.`,
    `Observed: ${s.statusSentence}`,
    `When: ${s.when}.`,
    s.note && `Note: ${s.note}`,
    s.extra && `More detail: ${s.extra}`,
    s.hasPhoto ? "The rider attached a photo." : "No photo attached.",
  ]
    .filter(Boolean)
    .join("\n");
}
