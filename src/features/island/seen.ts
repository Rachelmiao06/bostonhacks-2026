"use client";

// What this browser has already been shown on the island, so a later visit does not replay the opening
// and only the NEW piece needs a thread pull. This is display memory only: the stamps themselves
// (and tokens) are counted by the server from /api/submissions. Nothing here awards or stores points.
import { getRiderId } from "@/lib/rider";

const KEY = "tparty.island.seen";

/** How many unlock tiers the rider has already seen knitted, or null if they have never opened the island. */
export function readSeen(): number | null {
  try {
    const raw = window.localStorage.getItem(`${KEY}:${getRiderId()}`);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

export function writeSeen(tiers: number) {
  try {
    window.localStorage.setItem(`${KEY}:${getRiderId()}`, String(Math.max(0, Math.floor(tiers))));
  } catch {
    // storage blocked: the opening simply plays again next time
  }
}
