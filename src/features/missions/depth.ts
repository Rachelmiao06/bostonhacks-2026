import type { Quest, QuestChecks } from "@/lib/mbta";
import { depth as words } from "./content";

/**
 * The "depth" of a mission: what makes one escalator check different from the next.
 * Everything here is worked out from the verified MBTA alert and from real rider counts.
 * Nothing is estimated: a fact with no data behind it is left out, never guessed.
 */

export type Fact = { value: string; label: string };

const DAY = 86_400_000;
const BOSTON = "America/New_York";

function duration(days: number): string {
  if (days < 1) return words.today;
  if (days < 60) return words.days(days);
  if (days < 730) return words.months(Math.round(days / 30));
  return words.years((days / 365).toFixed(1).replace(/\.0$/, ""));
}

export function ago(iso: string, now: Date): string {
  const ms = Math.max(0, now.getTime() - new Date(iso).getTime());
  if (ms < 3_600_000) return words.minutesAgo(Math.max(1, Math.round(ms / 60_000)));
  if (ms < DAY) return words.hoursAgo(Math.round(ms / 3_600_000));
  return words.daysAgo(Math.round(ms / DAY));
}

function ordinal(n: number): string {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${suffix}`;
}

/** MBTA's service day runs until about 3am, so "ends Dec 2, 3:00am" means "through Dec 1". */
function serviceDay(iso: string): string {
  const shifted = new Date(new Date(iso).getTime() - 4 * 3_600_000);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: BOSTON }).format(shifted);
}

/** Up to three short facts for the overview. Each one appears only when its data exists. */
export function storyFacts(quest: Quest, now: Date): Fact[] {
  const facts: Fact[] = [];
  const unit = quest.kind === "elevator" || quest.kind === "escalator";
  if (quest.mode === "verify") {
    if (quest.resolvedAt) facts.push({ value: ago(quest.resolvedAt, now), label: words.fixedLabel });
  } else {
    facts.push({ value: duration(quest.daysOpen), label: unit ? words.outLabel : words.ongoingLabel });
  }
  if (quest.failuresLast90Days !== undefined && quest.failuresLast90Days >= 2) {
    facts.push({ value: words.nthTime(ordinal(quest.failuresLast90Days)), label: words.in90Days });
  }
  if (quest.mode === "report" && quest.expectedEnd && new Date(quest.expectedEnd).getTime() > now.getTime()) {
    facts.push({ value: serviceDay(quest.expectedEnd), label: words.plannedEnd });
  }
  return facts;
}

const DIRECTION = /\bTo (?:exit|board|travel|access|reach|transfer|enter|get)\b/;

/**
 * Splits MBTA's own description into its explanation ("closed for major equipment upgrades...") and its
 * step-free directions ("To board a train to Forest Hills: ..."). The words are MBTA's, only cut into pieces.
 */
export function mbtaNotes(description: string | null): { about: string | null; ways: string[] } {
  if (!description) return { about: null, ways: [] };
  // MBTA mixes real line breaks with a typed-out "\n".
  const text = description.replace(/\\n/g, "\n").replace(/\r/g, "");
  const pieces = text
    .split(new RegExp(`\\n+|(?<=[.!?])\\s+(?=${DIRECTION.source})`))
    .map((p) => p.trim())
    .filter(Boolean);
  const ways: string[] = [];
  const about: string[] = [];
  for (const piece of pieces) {
    if (DIRECTION.test(piece.slice(0, 14))) ways.push(piece);
    // A line that carries on from a direction ("...follow signs for") stays with it.
    else if (ways.length > 0) ways[ways.length - 1] += ` ${piece}`;
    else about.push(piece);
  }
  const explanation = about.filter((p) => !/^affected lines?:?$/i.test(p) && !/ line$/i.test(p)).join(" ");
  return { about: explanation || null, ways };
}

export type Impact = { headline: string; detail: string | null };

/**
 * What this rider's check added. `checks` is the count from when the mission was opened.
 * `already` means the rider had finished it on an earlier visit, so the count includes them.
 */
export function impactOf(checks: QuestChecks | undefined, already: boolean, verify: boolean, now: Date): Impact | null {
  if (!checks) return null; // unknown is not zero: say nothing
  const others = Math.max(0, checks.riders - (already ? 1 : 0));
  if (others === 0) return { headline: words.first, detail: words.firstDetail };
  let detail: string | null = null;
  if (!already) {
    const verdicts = verify && checks.working + checks.stillBroken > 0 ? words.verdicts(checks.working, checks.stillBroken) : null;
    const last = checks.lastAt ? words.lastCheck(ago(checks.lastAt, now)) : null;
    detail = [verdicts, last].filter(Boolean).join(" ") || null;
  }
  return { headline: words.joined(others), detail };
}
