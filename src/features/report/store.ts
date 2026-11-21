// Cases live on this device (no accounts). Browser storage can be missing or blocked, so every call is guarded.
import type { SavedCase } from "./types";

const KEY = "tada.report.cases";

export function loadCases(): SavedCase[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as SavedCase[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveCase(c: SavedCase) {
  try {
    const list = loadCases().filter((x) => x.caseId !== c.caseId); // one card per case id
    localStorage.setItem(KEY, JSON.stringify([c, ...list].slice(0, 30)));
  } catch {
    // storage full or blocked: the case simply isn't remembered
  }
}

/** The clock, read when a case is saved (kept out of render code so components stay pure). */
export const nowMs = () => Date.now();

const PRIMER = "tada.report.primer";

/** Whether the "before we ask for your camera and location" note has been read. */
export function primerSeen(): boolean {
  try {
    return localStorage.getItem(PRIMER) === "1";
  } catch {
    return false;
  }
}

export function markPrimerSeen() {
  try {
    localStorage.setItem(PRIMER, "1");
  } catch {
    // ignore
  }
}
