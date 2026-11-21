// The one partner perk the knitted parcel holds. All text on the coupon ticket comes from here.
//
// Honesty rule: there is no merchant partnership yet, so the only perk is a DEMO. A demo ticket never
// shows a code or barcode and says plainly that nothing can be redeemed.
// When a real partner exists, the code must NOT be written here (anyone can read it in the browser and
// share it). It has to come from the server, one per rider; that needs a small new API route, which is
// deliberately not built yet.

export type Perk = {
  /** "demo": no merchant, nothing to redeem. A "live" perk needs a server-issued code first. */
  status: "demo";
  partner: string;
  offer: string;
  /** How many contributions make the parcel appear (the server's count, via the island plan). */
  minStamps: number;
};

export const perk: Perk | null = {
  status: "demo",
  partner: "a neighbourhood café",
  offer: "A free coffee",
  minStamps: 3,
};

export function perkReady(contributions: number): boolean {
  return perk !== null && contributions >= perk.minStamps;
}
