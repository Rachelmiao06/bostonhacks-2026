import {
  Accessibility,
  ArrowUpDown,
  BadgeCheck,
  Ban,
  Bus,
  ChevronsUp,
  Construction,
  OctagonX,
  type LucideIcon,
} from "lucide-react";
import type { GlyphId, LineId, Tone } from "../vocab";

// PLACEHOLDER LOOK. Meaning comes from ../vocab.ts; this file only says how the demo draws it.
// Replace freely: icon set, colours, sizes. Class names are written out in full so Tailwind can see them.

export const ICONS: Record<GlyphId, LucideIcon> = {
  elevator: ArrowUpDown,
  escalator: ChevronsUp,
  access: Accessibility,
  station: Construction,
  closure: Ban,
  shuttle: Bus,
  suspension: OctagonX,
  verify: BadgeCheck,
};

export const TONE: Record<Tone, { bg: string; text: string; ring: string }> = {
  service: { bg: "bg-cat-service", text: "text-cat-service", ring: "ring-cat-service" },
  access: { bg: "bg-cat-access", text: "text-cat-access", ring: "ring-cat-access" },
  station: { bg: "bg-cat-station", text: "text-cat-station", ring: "ring-cat-station" },
  verify: { bg: "bg-cat-verify", text: "text-cat-verify", ring: "ring-cat-verify" },
};

// Palette pending: line colours are not tokens yet, so the demo borrows the nearest existing ones.
export const LINE_DOT: Record<LineId, string> = {
  red: "bg-cherry",
  orange: "bg-sun",
  blue: "bg-sky",
  green: "bg-leaf",
  mattapan: "bg-cherry",
};
