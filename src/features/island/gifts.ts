// What a gift can show. Three kinds are kept apart on purpose:
//   'place'              a REAL nearby business (src/lib/places.ts). It has no offer: a listing is not a promotion.
//   'demo'               a clearly labelled fictional example offer that cannot be redeemed (below).
//   'real-offer' / 'verified-promotion'  reserved. Nothing produces them yet: there is no partner data, no server-side
//                        entitlement or redemption, and no verified public promotion source.
// The little gifts' offers. There is NO real partner-offer source in this project yet (no merchants, no
// inventory, no redemption), so every gift is a clearly labelled demo whose code works nowhere.
//
// A real offer would need: a server-issued entitlement per rider (limited issuance), a claim and redemption
// state in the database (never localStorage), an expiry the server enforces, and abuse prevention.
// When that exists, `GET /api/gifts` should return these same fields with `demo: false` and a real `code`.

export type Gift = {
  id: string;
  /** True for the placeholders. The ticket labels demo gifts and says their code works nowhere. */
  demo: boolean;
  /** A few words for the floating label next to the gift in the scene. */
  short: string;
  merchant: string;
  benefit: string;
  expires: string;
  conditions: string;
  /** The real state: demo gifts are never redeemable. A real offer reports available, claimed, redeemed or expired. */
  status: string;
  /** Shown after "Reveal the code". For a demo this is an obvious example, never a usable code. */
  code: string;
  instructions?: string;
};

const demo = (id: string, short: string, merchant: string, benefit: string, code: string): Gift => ({
  id,
  demo: true,
  short,
  merchant: `${merchant} (not a real place)`,
  benefit: `${benefit}, as an example`,
  expires: "Never valid. This is only a picture of an offer.",
  conditions: "Demo content for this prototype. It cannot be used anywhere.",
  status: "Demo only, not redeemable",
  code,
});

/** One per gift, in the same order as `giftMilestones`. Fictional on purpose: never put a real shop's name on an invented discount. */
export const demoGifts: Gift[] = [
  demo("demo-surprise", "A free cookie", "Example Café", "A free cookie with any hot drink", "EXAMPLE-ONLY-1"),
  demo("demo-pastry", "A free pastry", "Example Bakery", "A free pastry with a coffee", "EXAMPLE-ONLY-2"),
  demo("demo-ride", "A free tyre check", "Example Bike Shop", "A free tyre check", "EXAMPLE-ONLY-3"),
];
