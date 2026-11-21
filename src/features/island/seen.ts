"use client";

// What this browser has already been shown on the island, so a later visit does not replay the opening
// and only the NEW piece needs a thread pull. This is display memory only: contributions are counted by
// the server from /api/submissions. Nothing here awards or stores anything of value.
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

/**
 * Whether this browser has already opened the little gift. Display memory for the DEMO gift only
 * (it has no value). A real offer's claimed / redeemed / expired state must come from the server.
 */
export function readParcelOpened(giftId: string): boolean {
  try {
    return window.localStorage.getItem(`tparty.island.parcel:${getRiderId()}:${giftId}`) === "1";
  } catch {
    return false;
  }
}

export function writeParcelOpened(giftId: string) {
  try {
    window.localStorage.setItem(`tparty.island.parcel:${getRiderId()}:${giftId}`, "1");
  } catch {
    // storage blocked: the gift simply shows closed again next time
  }
}

/** How many first-visit tips this browser has finished (0 to 3). Display memory only. */
export function readOnboard(): number {
  try {
    const n = Number(window.localStorage.getItem(`tparty.island.onboard:${getRiderId()}`));
    return Number.isInteger(n) && n >= 0 && n <= 3 ? n : 0;
  } catch {
    return 0;
  }
}

export function writeOnboard(step: number) {
  try {
    window.localStorage.setItem(`tparty.island.onboard:${getRiderId()}`, String(Math.min(3, Math.max(0, Math.floor(step)))));
  } catch {
    // storage blocked: the tips simply show again next time
  }
}
