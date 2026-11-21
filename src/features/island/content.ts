export const content = {
  title: "Your island",
  eyebrow: "Reward world",
  loading: "Winding the yarn…",
  error: "The island could not start in this browser (it needs WebGL).",
  progress: (stamps: number, total: number) => `${stamps} of ${total} stamps`,
  progressUnknown: "Checking your stamps…",
  hint: "Pull the thread to knit your island, or use the button. Then drag to look around and poke things.",
  knitButton: "Knit the island for me",
  knitting: "Knitting your island…",
  knitted: "Your island is knitted. Drag to look around, poke things, or pull the loose end to unravel it.",
  waiting: "Pull the thread to start. You can also use the button.",
  nextUnlock: (name: string) => `Next stamp knits in: ${name}`,
  allUnlocked: "Everything is knitted. Pull the loose end to unravel it.",
  previewLabel: "Preview the full island",
  previewOffLabel: "Back to my island",
  previewNote: "Preview only. Your stamps are not changed.",
  soundHint: "Press M to mute.",
  credit: "Island by Kris Yang (Yarn World, MIT licence). Sounds are CC0 from freesound.org.",
  creditUrl: "https://github.com/krisyangdev/yarn-world",
  fromRewards: "See your island",
  welcomeBack: (stamps: number, total: number) => `Welcome back. ${stamps} of ${total} stamps are knitted in.`,
  giftReady: (name: string) => `New stamp: ${name} is ready. Pull the loose thread on the quilt to knit it in.`,
  giftButton: "Knit it in for me",
  giftKnitted: (name: string) => `Knitted in: ${name}.`,
  giftMore: "Another stamp is waiting. Look for the next loose thread.",
  unavailable: "Your stamps could not load right now, so the island shows what is saved here.",
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
