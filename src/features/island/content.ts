export const content = {
  title: "Your island",
  eyebrow: "Reward world",
  loading: "Winding the yarn…",
  error: "The island could not start in this browser (it needs WebGL).",
  progressUnknown: "Checking your island…",
  hint: "Drag to look around and poke things.",
  hintOpening: "Drag the loose thread to knit your island, or use the button. Drag anywhere else to look around.",
  pullInstruction: "Pull the thread.",
  allReady: "Every piece you have earned is ready to knit in.",
  knitButton: "Knit the island for me",
  knitting: "Knitting your island…",
  knitted: "Your island is knitted. Drag to look around, poke things, or pull the loose end to unravel it.",
  waiting: "Pull the thread to start. You can also use the button.",
  nextUnlock: (name: string) => `Next to knit in: ${name}`,
  allUnlocked: "Everything is knitted. Pull the loose end to unravel it.",
  previewLabel: "Preview the full island",
  previewOffLabel: "Back to my island",
  previewNote: "Preview only. Your island is not changed.",
  soundHint: "Press M to mute.",
  credit: "Island by Kris Yang (Yarn World, MIT licence). Sounds are CC0 from freesound.org.",
  creditUrl: "https://github.com/krisyangdev/yarn-world",
  fromRewards: "See your island",
  welcomeBack: "Welcome back. Your island keeps growing with every contribution.",
  giftReady: (name: string) => `New on your island: ${name}. Pull the loose thread on the quilt to knit it in.`,
  giftButton: "Knit it in for me",
  giftKnitted: (name: string) => `Knitted in: ${name}.`,
  giftMore: "Something else is waiting. Look for the next loose thread.",
  unavailable: "Your island could not load right now, so it shows what is saved here.",
  parcelWaiting: "A small parcel is waiting on your island. Poke it to open it.",
  parcelButton: "Open your parcel",
  ticket: {
    label: "Your local perk",
    eyebrow: "Local perk",
    demo: "Demo",
    stampTop: "Sample",
    at: (partner: string) => `at ${partner}`,
    demoNote: "This is a demo ticket. No café has signed up yet, so there is nothing to redeem.",
    honest: "Perks come from local partners, not the MBTA. Poke the parcel any time to see it again.",
    close: "Back to my island",
  },
};

/**
 * What each stamp knits into the island. Stage names are the ones Yarn World uses.
 * 1 stamp unlocks the first tier, 2 stamps the first two, and so on; 5 stamps is the whole island.
 * The yarn ball (stage "ball") and the quilt with its river are always there: that is how you start.
 */
export const unlockTiers: { name: string; stages: string[] }[] = [
  { name: "grass, trees and flowers", stages: ["grass", "flower", "tree", "pine"] },
  { name: "the cottage and its garden", stages: ["house", "garden", "fence"] },
  { name: "the sheep", stages: ["sheep"] },
  { name: "ducks, the bridge and stepping stones", stages: ["water", "bridge", "stone"] },
  { name: "kite, laundry, pinwheels and clouds", stages: ["prop", "cloud"] },
];

export const alwaysStages = ["ball"];

export function stagesFor(stamps: number): Set<string> {
  const stages = new Set(alwaysStages);
  unlockTiers.slice(0, Math.max(0, stamps)).forEach((tier) => tier.stages.forEach((s) => stages.add(s)));
  return stages;
}
