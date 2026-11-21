import { BadgeCheck, Coins } from "lucide-react";
import { words } from "../content";

/** PLACEHOLDER CELEBRATION: coins and a stamp. It disappears by itself; the map then points at the next problem. */
export function Reward({ tokens }: { tokens: number }) {
  const coins = Math.min(tokens, 8);
  return (
    <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-[1px]" role="img" aria-label={words.reward(tokens)}>
      <div className="relative grid place-items-center">
        <BadgeCheck className="size-32 text-cat-verify" strokeWidth={1.25} aria-hidden />
        <div className="absolute -top-6 flex gap-2" aria-hidden>
          {Array.from({ length: coins }, (_, i) => (
            <Coins key={i} className="size-7 animate-bounce text-foreground motion-reduce:animate-none" style={{ animationDelay: `${i * 90}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
