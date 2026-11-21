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

  parcel: {
    label: "A little gift is waiting. Open it.",
    kicker: "Demo surprise · example only",
    realKicker: "A gift for you",
    title: "A Little Gift from Boston",
    subtitle: "A treat for your next ride",
    merchant: "Merchant",
    benefit: "Benefit",
    expires: "Expires",
    conditions: "Conditions",
    status: "Status",
    code: "Code",
    instructions: "How to redeem",
    close: "Close and go back to the island",
  },
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
  { name: "the bridge and the river's little life", add: { bridge: Infinity, water: Infinity } },
  { name: "a kite, laundry and pinwheels", add: { prop: Infinity } },
  { name: "clouds", add: { cloud: Infinity } },
];

/** How many pieces of each stage exist after `steps` contributions. The yarn ball is always there. */
export function allowedFor(steps: number): Record<string, number> {
  const allowed: Record<string, number> = { ball: Infinity };
  unlockSteps.slice(0, Math.max(0, steps)).forEach((step) => {
    for (const [stage, n] of Object.entries(step.add)) allowed[stage] = Math.max(allowed[stage] ?? 0, n);
  });
  return allowed;
}

/** Does piece number `k` of `stage` exist at this point of the journey? `parcel` is the little gift. */
export const isIn = (allowed: Record<string, number>) => (stage: string, k: number) => (allowed[stage] ?? 0) > k;
