import { cn } from "@/lib/utils";

const TONES = {
  sky: "fill-sky",
  cherry: "fill-cherry",
  leaf: "fill-leaf",
  sun: "fill-sun",
} as const;

type PawnProps = {
  tone?: keyof typeof TONES;
  size?: number;
  className?: string;
};

/** A board-game pawn. Decorative. */
export function Pawn({ tone = "sky", size = 64, className }: PawnProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 64 96"
      width={size}
      height={size * 1.5}
      className={cn("overflow-visible stroke-ink stroke-[4] [stroke-linejoin:round]", className)}
    >
      {/* floor shadow */}
      <ellipse cx="34" cy="90" rx="26" ry="6" className="fill-[var(--shade)] stroke-0" />
      {/* base */}
      <path d="M8 82c0-8 10-12 24-12s24 4 24 12c0 5-10 8-24 8S8 87 8 82Z" className={TONES[tone]} />
      {/* body */}
      <path d="M22 70c2-10 5-18 5-26h10c0 8 3 16 5 26-6 3-14 3-20 0Z" className={TONES[tone]} />
      {/* collar */}
      <ellipse cx="32" cy="44" rx="14" ry="5" className={TONES[tone]} />
      {/* head */}
      <circle cx="32" cy="26" r="17" className={TONES[tone]} />
      {/* shine */}
      <path d="M24 18c2-4 6-6 10-6" className="fill-none stroke-paper/70 stroke-[4] [stroke-linecap:round]" />
    </svg>
  );
}
