export const content = {
  title: "Your island",
  eyebrow: "Reward world",
  loading: "Winding the yarn…",
  error: "The island could not start in this browser (it needs WebGL).",
  progress: (stamps: number, total: number) => `${stamps} of ${total} stamps`,
  progressUnknown: "Checking your stamps…",
  hint: "Drag to look around and poke things.",
  hintOpening: "Drag the loose thread to knit your island, or use the button. Drag anywhere else to look around.",
  pullInstruction: "Pull the thread.",
  allReady: "Every piece you have earned is ready to knit in.",
  knitButton: "Knit the island for me",
  knitting: "Knitting your island…",
  knitted: "Your island is knitted. Drag to look around, poke things, or pull the loose end to unravel it.",
  waiting: "Pull the thread to start. You can also use the button.",
  nextUnlock: (name: string) => `Next stamp brings: ${name}`,
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
  portalOpening: "A purple portal is opening above the island.",
  portalDone: (name: string) => `Arrived: ${name}.`,
  portalButton: "Open the portal",
  giftKnitted: (name: string) => `Knitted in: ${name}.`,
  giftMore: "Another stamp is waiting. Look for the next loose thread.",
  unavailable: "Your stamps could not load right now, so the island shows what is saved here.",
};

/**
 * What each stamp brings to the island. Stage names are the ones Yarn World uses (plus `trophyN` and `sheepN`, ours).
 * Stamp n gives reward n. `stages` knit in from a loose thread on the quilt; `drops` fall through a purple portal.
 * - The first four stamps also knit in the world itself (grass and the first sheep, the cottage, the water, the kite).
 * - Every stamp drops one trophy, up to `maxTrophies`.
 * - Sheep: one from the start, then one more at 3, 6 and 9 stamps. Four is the most.
 * The yarn ball (stage "ball") and the quilt with its river are always there: that is how you start.
 */
export type Reward = { name: string; stages: string[]; drops: string[] };

export const maxTrophies = 12;
/** Stamp counts at which sheep 1 to 4 arrive. The first comes with the grass; the rest fall through the portal. */
export const sheepAt = [1, 3, 6, 9];

const worldPieces: { name: string; stages: string[] }[] = [
  { name: "grass, trees, flowers and your first sheep", stages: ["grass", "flower", "tree", "pine", "sheep"] },
  { name: "the cottage and its garden", stages: ["house", "garden", "fence"] },
  { name: "ducks, the bridge and stepping stones", stages: ["water", "bridge", "stone"] },
  { name: "kite, laundry, pinwheels and clouds", stages: ["prop", "cloud"] },
];
const sheepWords = ["", "a second sheep", "a third sheep", "a fourth sheep"];

export const rewards: Reward[] = Array.from({ length: maxTrophies }, (_, i) => {
  const stamp = i + 1;
  const piece = worldPieces[i];
  // sheep number (0 based) that this stamp adds; the first one is part of the world piece above
  const sheep = sheepAt.indexOf(stamp);
  const parts = [piece?.name, "a trophy", sheep > 0 ? sheepWords[sheep] : null].filter(Boolean) as string[];
  const name = parts.length > 2 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts.join(" and ");
  return {
    name,
    stages: piece?.stages ?? [],
    drops: [`trophy${stamp}`, ...(sheep > 0 ? [`sheep${sheep + 1}`] : [])],
  };
});

/** Celebration and the island page read this under its older name. */
export const unlockTiers = rewards;

export const alwaysStages = ["ball"];

/** Every stage that stamps 1..`stamps` have earned. */
export function stagesFor(stamps: number): Set<string> {
  const stages = new Set(alwaysStages);
  rewards.slice(0, Math.max(0, stamps)).forEach((r) => [...r.stages, ...r.drops].forEach((s) => stages.add(s)));
  return stages;
}
