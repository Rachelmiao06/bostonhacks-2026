export const content = {
  title: "Your Little World",
  subtitle: "A little world shaped by your contributions.",
  loading: "Winding the yarn…",

  // One small status at a time. The scene and the rider's progress fail for different reasons.
  sceneFailed: "The island could not start in this browser. It needs WebGL.",
  progressFailed: "Could not check your progress just now.",
  retry: "Retry",

  knitButton: "Knit it for me",
  giftButton: "Knit it in for me",
  giftReady: "A new piece is ready to knit.",
  giftMore: "Another piece is ready to knit.",
  giftKnitted: "Your little world just grew!",

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
 * What each contribution knits into the island. Stage names are the ones Yarn World uses.
 * 1 contribution unlocks the first tier, 2 the first two, and so on; 5 is the whole island.
 * The yarn ball (stage "ball") and the quilt with its river are always there: that is how you start.
 * More contributions are still recorded by the server; there are simply no more pieces to knit yet.
 */
export const unlockTiers: { name: string; stages: string[] }[] = [
  { name: "grass, trees and flowers", stages: ["grass", "flower", "tree", "pine"] },
  { name: "the cottage and its garden", stages: ["house", "garden", "fence"] },
  { name: "the sheep", stages: ["sheep"] },
  { name: "ducks, the bridge and stepping stones", stages: ["water", "bridge", "stone"] },
  { name: "kite, laundry, pinwheels and clouds", stages: ["prop", "cloud"] },
];

export const alwaysStages = ["ball"];

/** The pieces that may knit in. `parcel` is the little gift, present only when the server has confirmed one is available. */
export function stagesFor(contributions: number, withParcel = false): Set<string> {
  const stages = new Set(alwaysStages);
  unlockTiers.slice(0, Math.max(0, contributions)).forEach((tier) => tier.stages.forEach((s) => stages.add(s)));
  if (withParcel) stages.add("parcel");
  return stages;
}
