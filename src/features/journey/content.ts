import type { Quest } from "@/lib/mbta";
import type { Stage } from "./machine";
import type { GlyphId, Glyphs } from "./vocab";

/**
 * THE ONLY WORDS IN THIS FEATURE.
 *
 * Nothing on screen is text: the surface is icons, colour, shape and gesture. These words exist for
 * screen readers and for the short announcements that say what just changed. Every interactive thing
 * must take its accessible name from here, so removing visible text never removes the way in for
 * someone who cannot see the screen.
 */
export const words = {
  surface: "Transit problems map",

  /** Read out by a polite live region whenever the stage changes. */
  stage: {
    explore: "Map. Choose a problem to help with.",
    focus: "Problem chosen. Describe what you see, or add a photo.",
    drafting: "Writing. Pause and your note is checked automatically.",
    reviewing: "Checking your note.",
    revising: "Your note needs a little more detail.",
    ready: "Your note is ready. Press and hold to send.",
    sending: "Sending.",
    reward: "Done. Tokens earned.",
  } satisfies Record<Stage, string>,

  input: {
    text: "Describe what you see: when, where, and how it affects you",
    photo: "Add a photo",
    camera: "Take a photo",
    removePhoto: "Remove the photo",
  },

  gesture: {
    commit: "Press and hold to send. With a keyboard, press Enter.",
    retry: "The check could not run. Tap to try again.",
    dismiss: "Swipe down or press Escape to close.",
  },

  status: {
    pending: "Checking",
    needs_work: "Needs more detail",
    passed: "Ready to send",
    failed: "Check could not run",
    sending: "Sending",
  },

  /** On an open problem: what it is worth. */
  worth: (tokens: number) => `worth ${tokens} ${tokens === 1 ? "token" : "tokens"}`,
  /** After finishing: what was won. */
  reward: (tokens: number) => `${tokens} ${tokens === 1 ? "token" : "tokens"} earned`,
  next: "Next problem highlighted on the map",
};

const KIND_NAMES: Record<GlyphId, string> = {
  elevator: "Elevator out",
  escalator: "Escalator out",
  access: "Accessibility problem",
  station: "Station change",
  closure: "Station closed",
  shuttle: "Shuttle buses replace trains",
  suspension: "No train service",
  verify: "Check that a fix works",
};

const LINE_NAMES = { red: "Red", orange: "Orange", blue: "Blue", green: "Green", mattapan: "Mattapan" } as const;

/** The accessible name of one quest, built from the same facts the glyphs draw. */
export function questName(quest: Pick<Quest, "stationName" | "daysOpen" | "mode">, glyphs: Glyphs): string {
  const parts = [`${KIND_NAMES[glyphs.icon]} at ${quest.stationName}`];
  if (glyphs.lines.length) parts.push(`${glyphs.lines.map((l) => LINE_NAMES[l]).join(" and ")} line`);
  if (quest.mode === "report" && quest.daysOpen >= 1) parts.push(`open ${quest.daysOpen} ${quest.daysOpen === 1 ? "day" : "days"}`);
  parts.push(words.worth(glyphs.reward));
  if (glyphs.done) parts.push("already done");
  return parts.join(", ");
}
