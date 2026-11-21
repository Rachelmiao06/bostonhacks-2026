export const content = {
  title: "Your Little World",
  subtitle: "A little world shaped by your contributions.",
  loading: "Winding the yarn…",

  // One small status at a time. The scene and the rider's progress fail for different reasons.
  sceneFailed: "The island could not start in this browser. It needs WebGL.",
  progressFailed: "Could not check your progress just now.",
  retry: "Retry",

  knitButton: "Knit it for me",
  grew: (name: string) => `Your little world just grew: ${name}.`,

  // Read aloud only
  waiting: "Pull the thread to start. You can also use the knit button.",
  knitting: "Knitting your world…",
  knitted: "Your world is knitted. Drag to look around, poke things, or pull the loose end to unravel it.",

  help: {
    open: "Help",
    close: "Close help",
    title: "Around your world",
    lines: [
      "Drag to look around, and poke things.",
      "Pull a loose thread to knit in a new piece.",
      "Every contribution on the map helps your world grow.",
    ],
    sound: "Press M to mute.",
    previewLabel: "Preview the full island",
    previewOffLabel: "Back to my island",
    previewNote: "Preview only. Nothing about your world changes.",
  },

  credit: "Island by Kris Yang (Yarn World, MIT licence). Sounds are CC0 from freesound.org.",
  creditUrl: "https://github.com/krisyangdev/yarn-world",

  gift: {
    label: (n: number, locked: boolean) => `Open gift ${n}${locked ? " (locked)" : ""}`,
    kicker: "Demo surprise · example only",
    realKicker: "A gift for you",
    title: "A Little Gift from Boston",
    subtitle: "A treat for your next ride",
    merchant: "Merchant",
    benefit: "Benefit",
    expires: "Expires",
    conditions: "Conditions",
    status: "Status",
    code: "Promo code",
    reveal: "Reveal the code",
    codeNote: "Example only. This code works nowhere.",
    locked: (need: number) => `Locked. ${need} more ${need === 1 ? "contribution" : "contributions"} on the map opens it.`,
    close: "Close and go back to the island",
  },

  journey: {
    title: "Your journey",
    summary: (known: number, total: number) => `${known} of ${total} pieces on your island`,
    next: (need: number) => `Next gift after ${need} more ${need === 1 ? "contribution" : "contributions"}`,
    allGifts: "Every gift is hanging in your clouds.",
    unknown: "Could not check your progress just now.",
    start: "A quilt, a river and a ball of yarn",
    gift: (n: number) => `Gift ${n}`,
    more: "More contributions are still counted. There is nothing more to add to the island yet.",
  },
  giftUnlocked: "A new gift is hanging in the clouds.",
};

/**
 * The journey: what each contribution adds to the island, in order. A rider with no contributions has a bare quilt,
 * a river and the yarn ball; every contribution after that drops one more thing onto the island. Stage names are
 * the ones Yarn World uses. `add` is how many pieces of a stage exist after this step (Infinity = all of them).
 * Only existing pieces are used, so there are 12 steps; more contributions are still recorded by the server,
 * there is simply nothing more to add yet.
 */
export const unlockSteps: { name: string; add: Record<string, number> }[] = [
  { name: "grass and the first flowers", add: { grass: Infinity, flower: 2 } },
  { name: "a round tree", add: { tree: 1 } },
  { name: "two pine trees", add: { pine: 2 } },
  { name: "stones by the river", add: { stone: Infinity } },
  { name: "the cottage", add: { house: Infinity } },
  { name: "its garden and fence", add: { garden: Infinity, fence: Infinity } },
  { name: "a sheep", add: { sheep: 1 } },
  { name: "more trees and flowers", add: { tree: Infinity, pine: Infinity, flower: Infinity } },
  { name: "the rest of the flock", add: { sheep: Infinity } },
  { name: "the bridge", add: { bridge: Infinity } },
  { name: "the river's little life", add: { water: Infinity } },
  { name: "a kite, laundry and pinwheels", add: { prop: Infinity } },
];

/** How many pieces of each stage exist after `steps` contributions. The yarn ball and the clouds (which carry the gifts) are always there. */
export function allowedFor(steps: number): Record<string, number> {
  const allowed: Record<string, number> = { ball: Infinity, cloud: Infinity };
  unlockSteps.slice(0, Math.max(0, steps)).forEach((step) => {
    for (const [stage, n] of Object.entries(step.add)) allowed[stage] = Math.max(allowed[stage] ?? 0, n);
  });
  return allowed;
}

/** Does piece number `k` of `stage` exist at this point of the journey? */
export const isIn = (allowed: Record<string, number>) => (stage: string, k: number) => (allowed[stage] ?? 0) > k;

/**
 * The gifts hanging from the three clouds. Gift i can be opened once the journey has reached `giftMilestones[i]` steps:
 * the first is always there; more gifts come with more contributions. Until then a gift hangs faint ('locked').
 */
export const giftMilestones = [0, 5, 10];

export type GiftState = "locked" | "ready" | "opened";

export function giftStatesFor(known: number, opened: boolean[]): GiftState[] {
  return giftMilestones.map((m, i) => (m > known ? "locked" : opened[i] ? "opened" : "ready"));
}

/** The next locked gift: its number (1-based) and how many more contributions it needs, or null when all are open. */
export function nextGift(known: number): { number: number; need: number } | null {
  const i = giftMilestones.findIndex((m) => m > known);
  return i < 0 ? null : { number: i + 1, need: giftMilestones[i] - known };
}
