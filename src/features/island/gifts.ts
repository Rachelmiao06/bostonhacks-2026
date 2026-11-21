// The little gift's offer. There is NO real partner-offer source in this project yet (no merchants, no
// inventory, no redemption), so the only gift is a clearly labelled demo that cannot be used anywhere.
//
// A real offer would need: a server-issued entitlement per rider (limited issuance), a claim and redemption
// state in the database (never localStorage), an expiry the server enforces, and abuse prevention.
// When that exists, `GET /api/gifts` should return these same fields and `demo: false`.

export type Gift = {
  id: string;
  /** True for the placeholder. The ticket labels demo gifts and never shows a code for them. */
  demo: boolean;
  merchant: string;
  benefit: string;
  expires: string;
  conditions: string;
  /** The real state: demo gifts are never redeemable. A real offer reports available, claimed, redeemed or expired. */
  status: string;
  /** Only for a genuine, server-issued offer. */
  code?: string;
  instructions?: string;
};

export const demoGift: Gift = {
  id: "demo-surprise",
  demo: true,
  merchant: "Example Café (not a real place)",
  benefit: "A free cookie with any hot drink, as an example",
  expires: "Never valid. This is only a picture of an offer.",
  conditions: "Demo content for this prototype. It cannot be used at any café and no code is issued.",
  status: "Demo only, not redeemable",
};
