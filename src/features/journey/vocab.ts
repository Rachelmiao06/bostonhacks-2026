import type { Quest, QuestKind } from "@/lib/mbta";
import type { Mode } from "./machine";

/**
 * THE WORDLESS VOCABULARY: how any quest is drawn without a single word.
 *
 * Screens never decide what a quest "means" visually. They ask `glyphsFor(quest)` and draw the answer.
 * That keeps every screen (map pin, card, sheet, list) saying the same thing, and lets the look change
 * (icons, colours, shapes) without touching the meaning.
 *
 * `Tone` is the same four-way grouping the map already uses (`categoryOfKind` in features/explore), so a
 * quest has one colour family everywhere. The tone names match the `cat-*` colour tokens.
 */
export type Tone = "service" | "access" | "station" | "verify";

/** What kind of thing it is. Draw one icon per id. */
export type GlyphId = QuestKind | "verify";

export type LineId = "red" | "orange" | "blue" | "green" | "mattapan";

/** 0 fresh (under a day), 1 days, 2 weeks, 3 a month or more. Draw it as pips, a ring, or a size. */
export type Urgency = 0 | 1 | 2 | 3;

export type Glyphs = {
  tone: Tone;
  icon: GlyphId;
  /** Subway lines the problem touches. Draw each as a dot in that line's colour. */
  lines: LineId[];
  urgency: Urgency;
  /** Tokens on offer. Draw that many coins (or one coin and a number). */
  reward: number;
  mode: Mode;
  /** The rider already finished this one. Draw a stamp. */
  done: boolean;
  /** False for an alert that MBTA lists between active periods. Draw it quieter. */
  active: boolean;
};

const TONE_OF_KIND: Record<QuestKind, Exclude<Tone, "verify">> = {
  closure: "service",
  shuttle: "service",
  suspension: "service",
  elevator: "access",
  access: "access",
  escalator: "station",
  station: "station",
};

const LINES: Record<string, LineId> = { red: "red", orange: "orange", blue: "blue", green: "green", mattapan: "mattapan" };

export function toneOf(quest: Pick<Quest, "mode" | "kind">): Tone {
  return quest.mode === "verify" ? "verify" : TONE_OF_KIND[quest.kind];
}

export function urgencyOf(daysOpen: number): Urgency {
  if (daysOpen < 1) return 0;
  if (daysOpen < 7) return 1;
  if (daysOpen < 30) return 2;
  return 3;
}

export function glyphsFor(quest: Quest, options: { done?: boolean } = {}): Glyphs {
  const lines = quest.lines.map((l) => LINES[l.toLowerCase()]).filter((l): l is LineId => Boolean(l));
  return {
    tone: toneOf(quest),
    icon: quest.mode === "verify" ? "verify" : quest.kind,
    lines: [...new Set(lines)],
    urgency: quest.mode === "verify" ? 0 : urgencyOf(quest.daysOpen),
    reward: quest.rewardTokens,
    mode: quest.mode,
    done: options.done ?? false,
    active: quest.activeNow !== false,
  };
}
