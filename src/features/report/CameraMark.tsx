// One small, stitched-camera mark for the entry screen. Drawn with theme colours only.
export function CameraMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 170" className={className} role="img" aria-label="A camera">
      <rect x="22" y="48" width="196" height="114" rx="30" className="fill-stone-deep" />
      <path d="M84 48 L96 26 H144 L156 48 Z" className="fill-stone-deep" />
      <rect x="28" y="54" width="184" height="102" rx="25" fill="none" className="stroke-graphite/40" strokeWidth="2.5" strokeDasharray="5 6" strokeLinecap="round" />
      <circle cx="120" cy="106" r="42" className="fill-ivory" />
      <circle cx="120" cy="106" r="34" className="fill-cat-verify" />
      <circle cx="120" cy="106" r="22" className="fill-ivory" />
      <circle cx="120" cy="106" r="11" className="fill-graphite" />
      <circle cx="109" cy="95" r="4" className="fill-ivory" />
      <circle cx="188" cy="72" r="7" className="fill-ivory" />
    </svg>
  );
}
