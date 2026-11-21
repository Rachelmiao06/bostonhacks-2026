// Anonymous rider id. There are no accounts: each browser gets a random id that the API routes
// accept as `userId` (8-64 letters, digits, _ or -). Browser only.
const KEY = "tparty:rider-id";
const VALID = /^[A-Za-z0-9_-]{8,64}$/;

let memoryId: string | null = null;

function newId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return "r_" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * The rider id, kept in localStorage. When storage is blocked (private mode, strict settings)
 * the id lives in memory for this page visit, so the flow still works but progress resets on reload.
 */
export function getRiderId(): string {
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved && VALID.test(saved)) return saved;
    const id = memoryId ?? newId();
    window.localStorage.setItem(KEY, id);
    memoryId = id;
    return id;
  } catch {
    memoryId ??= newId();
    return memoryId;
  }
}
