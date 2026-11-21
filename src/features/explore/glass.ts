import type { CSSProperties } from "react";

// The look of the welcome, shared by the pieces that follow it (station picker, hint, celebration), so the whole first
// journey reads as one design: frosted glass, rounded heading type, and one pipe-green primary action.

/** Primary action: pressed green glass, lighter on top, a bright rim, a soft drop. Pair with `primaryClass`. */
export const primaryStyle: CSSProperties = {
  background: "linear-gradient(180deg, color-mix(in oklab, var(--leaf) 30%, var(--cat-verify)) 0%, var(--cat-verify) 100%)",
  boxShadow:
    "inset 0 1px 0 color-mix(in oklab, var(--ivory) 55%, transparent), inset 0 -1px 0 color-mix(in oklab, var(--graphite) 25%, transparent), 0 6px 14px -6px color-mix(in oklab, var(--cat-verify) 70%, transparent)",
};
export const primaryClass =
  "inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full font-heading font-semibold text-ivory outline-none transition-[filter,transform] hover:brightness-105 focus-visible:ring-4 focus-visible:ring-graphite/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

/** Secondary action: a clear glass pill. Pair with `glassStyle`. */
export const glassStyle: CSSProperties = {
  boxShadow: "inset 0 1px 0 var(--ivory), 0 1px 3px color-mix(in oklab, var(--graphite) 12%, transparent)",
};
export const glassClass =
  "inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full border border-graphite/20 bg-ivory/45 font-heading font-semibold text-graphite outline-none backdrop-blur-sm transition-colors hover:bg-ivory/65 focus-visible:ring-4 focus-visible:ring-graphite/25 disabled:cursor-not-allowed disabled:opacity-60";
