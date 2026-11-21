import type { Quest } from "@/lib/mbta";

/** Every tunable number of the flow, in one place. Change them here, never in a screen. */
export const policy = {
  /** After the rider stops typing for this long, the AI check starts by itself. There is no Check button. */
  autoReviewIdleMs: 1500,
  /** Text needed before an automatic check (a photo alone also counts). Keeps the server from checking one word. */
  autoReviewMinChars: 20,
  /** How long to press and hold the status ring to send. A hold is deliberate, so a stray tap cannot send. */
  commitHoldMs: 700,
  /** How far to drag the sheet down to close it. */
  dismissSwipePx: 80,
  /** How long the reward stays before the map takes over again by itself. */
  rewardLingerMs: 2400,
};

export type AutoReviewInput = {
  stage: string;
  chars: number;
  hasPhoto: boolean;
  /** True when the draft changed since the last check started. Prevents a loop after a failed check. */
  changedSinceCheck: boolean;
  /** How long since the last keystroke or photo change. */
  idleMs: number;
};

/** Should the AI check start by itself now? */
export function shouldAutoReview(input: AutoReviewInput): boolean {
  if (input.stage !== "drafting" || !input.changedSinceCheck) return false;
  if (input.chars < policy.autoReviewMinChars && !input.hasPhoto) return false;
  return input.idleMs >= policy.autoReviewIdleMs;
}

type Anchor = Pick<Quest, "stationId" | "lines" | "kind"> | null | undefined;

/**
 * After a reward, which problem should the map point at next? Nearby and similar first, so the rider keeps
 * moving without choosing. Returns a quest id, or null when nothing is left.
 */
export function suggestNext(quests: readonly Quest[], doneIds: ReadonlySet<string>, from?: Anchor, excludeId?: string): string | null {
  let best: { id: string; score: number } | null = null;
  for (const q of quests) {
    if (doneIds.has(q.id) || q.id === excludeId || q.activeNow === false) continue;
    let score = 0;
    if (from?.stationId && q.stationId === from.stationId) score += 4;
    if (from && q.lines.some((l) => from.lines.includes(l))) score += 2;
    if (from && q.kind === from.kind) score += 1;
    if (q.mode === "verify") score += 1; // one tap: a quick win
    if (!best || score > best.score || (score === best.score && q.id < best.id)) best = { id: q.id, score };
  }
  return best?.id ?? null;
}
