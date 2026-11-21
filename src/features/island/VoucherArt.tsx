import { cn } from "@/lib/utils";

export type ArtKind = "cafe" | "bakery" | "restaurant" | "ride" | "sealed";

/**
 * A small illustration for the top of a voucher, used when there is no real photo (OpenStreetMap has none).
 * It shows the KIND of place only (a cup, a croissant, a plate...), never a specific business. Colours are the app's tokens.
 */
export function VoucherArt({ kind, className }: { kind: ArtKind; className?: string }) {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-label={label[kind]} className={cn("block size-full", className)} preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="180" className={background[kind]} />
      <ellipse cx="160" cy="150" rx="120" ry="14" className="fill-graphite/10" />
      {kind === "cafe" && <Cafe />}
      {kind === "bakery" && <Bakery />}
      {kind === "restaurant" && <Restaurant />}
      {kind === "ride" && <Ride />}
      {kind === "sealed" && <Sealed />}
    </svg>
  );
}

const label: Record<ArtKind, string> = {
  cafe: "A cup of coffee and a cookie",
  bakery: "A croissant and a loaf of bread",
  restaurant: "A plate with a fork and knife",
  ride: "A bicycle wheel",
  sealed: "A wrapped gift, still folded",
};

const background: Record<ArtKind, string> = {
  cafe: "fill-cat-station/15",
  bakery: "fill-cat-service/10",
  restaurant: "fill-cat-verify/12",
  ride: "fill-cat-access/12",
  sealed: "fill-stone",
};

function Cafe() {
  return (
    <g>
      <path d="M98 78h92v34a46 38 0 0 1-92 0z" className="fill-ivory stroke-graphite/60" strokeWidth="3" />
      <path d="M190 90h14a16 16 0 0 1 0 32h-18" fill="none" className="stroke-graphite/60" strokeWidth="9" strokeLinecap="round" />
      <ellipse cx="144" cy="78" rx="46" ry="9" className="fill-cat-station stroke-graphite/60" strokeWidth="3" />
      <ellipse cx="144" cy="152" rx="76" ry="10" className="fill-ivory stroke-graphite/50" strokeWidth="3" />
      <path d="M128 56c-8-9 8-14 0-24M148 56c-8-9 8-14 0-24M168 56c-8-9 8-14 0-24" fill="none" className="stroke-taupe" strokeWidth="4" strokeLinecap="round" />
      <circle cx="238" cy="132" r="26" className="fill-cat-station/70 stroke-graphite/50" strokeWidth="3" />
      {[[228, 124], [246, 128], [236, 142], [250, 142]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="3.4" className="fill-graphite/70" />
      ))}
    </g>
  );
}

function Bakery() {
  return (
    <g>
      <path d="M70 132c-6-34 26-62 62-60 22 1 34 14 34 30s-12 34-34 38c-26 4-56 0-62-8z" className="fill-cat-station/80 stroke-graphite/60" strokeWidth="3" />
      <path d="M96 78c10 14 12 34 6 54M122 72c8 16 8 36 0 62M148 78c4 14 2 32-8 50" fill="none" className="stroke-graphite/40" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="226" cy="116" rx="52" ry="30" className="fill-cat-station/60 stroke-graphite/60" strokeWidth="3" />
      <path d="M196 100l14 18M222 94l14 22M248 100l12 18" fill="none" className="stroke-ivory" strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

function Restaurant() {
  return (
    <g>
      <circle cx="160" cy="92" r="54" className="fill-ivory stroke-graphite/60" strokeWidth="3" />
      <circle cx="160" cy="92" r="36" className="fill-cat-verify/25 stroke-graphite/30" strokeWidth="2" />
      <path d="M96 52v40a8 8 0 0 0 8 8v34M104 52v30M112 52v40a8 8 0 0 1-8 8" fill="none" className="stroke-graphite/70" strokeWidth="4" strokeLinecap="round" />
      <path d="M226 52c-10 10-12 34-6 48h6v36" fill="none" className="stroke-graphite/70" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function Ride() {
  return (
    <g>
      <circle cx="160" cy="92" r="52" fill="none" className="stroke-graphite/70" strokeWidth="9" />
      <circle cx="160" cy="92" r="52" fill="none" className="stroke-cat-access" strokeWidth="3" strokeDasharray="6 9" />
      <circle cx="160" cy="92" r="7" className="fill-graphite/70" />
      <path d="M160 92L160 42M160 92l44 26M160 92l-44 26M160 92l-50-18M160 92l50-18" className="stroke-graphite/40" strokeWidth="2" />
    </g>
  );
}

function Sealed() {
  return (
    <g>
      <rect x="112" y="74" width="96" height="70" rx="8" className="fill-ivory stroke-graphite/50" strokeWidth="3" />
      <rect x="104" y="58" width="112" height="24" rx="8" className="fill-ivory stroke-graphite/50" strokeWidth="3" />
      <path d="M160 58v86" className="stroke-cat-service" strokeWidth="14" />
      <path d="M160 58c-22-30-52-18-34-2 8 6 24 4 34 2zM160 58c22-30 52-18 34-2-8 6-24 4-34 2z" className="fill-cat-service stroke-graphite/40" strokeWidth="2" />
    </g>
  );
}
