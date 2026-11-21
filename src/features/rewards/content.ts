export const content = {
  title: "Your island",
  loading: "Winding the yarn…",
  error: "The island could not start in this browser (it needs WebGL).",
  progress: (done: number, total: number) => `${done} of ${total} stops completed`,
  hint: "Pull the thread to knit your island. Drag to look around, poke things.",
  nextUnlock: (name: string) => `Next stop unlocks: ${name}`,
  allUnlocked: "Everything is knitted. Pull the loose end to unravel it.",
  previewLabel: "Preview the full island",
  previewOffLabel: "Back to my island",
  previewNote: "Preview only. Your real progress is not changed.",
  credit: "Island by Kris Yang (Yarn World, MIT licence). Sounds are CC0 from freesound.org.",
  creditUrl: "https://github.com/krisyangdev/yarn-world",
  soundHint: "Press M to mute.",
};

/**
 * What each completed stop knits into the island. Stage names are the ones Yarn World uses.
 * Completing 1 stop unlocks the first tier, 2 stops the first two, and so on.
 * The yarn ball (stage "ball") is always there: it is how you start.
 */
export const unlockTiers: { name: string; stages: string[] }[] = [
  { name: "Grass, trees and flowers", stages: ["grass", "flower", "tree", "pine"] },
  { name: "The cottage and its garden", stages: ["house", "garden", "fence"] },
  { name: "The sheep", stages: ["sheep"] },
  { name: "The river, bridge and stepping stones", stages: ["water", "bridge", "stone"] },
  { name: "Kite, laundry, pinwheels and clouds", stages: ["prop", "cloud"] },
];

export const alwaysStages = ["ball"];

export function stagesFor(done: number): Set<string> {
  const stages = new Set(alwaysStages);
  unlockTiers.slice(0, Math.max(0, done)).forEach((tier) => tier.stages.forEach((s) => stages.add(s)));
  return stages;
}
