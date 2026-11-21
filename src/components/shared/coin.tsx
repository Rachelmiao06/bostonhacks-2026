import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** A spinning gold coin. Decorative. */
export function Coin({ size = 64, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block animate-coin", className)}
      style={{ width: size, height: size }}
    >
      <span className="grid size-full place-items-center rounded-full border-[3px] border-ink bg-sun shadow-chip">
        <span className="grid size-[72%] place-items-center rounded-full border-2 border-ink/40">
          <Star className="size-1/2 fill-ink text-ink" />
        </span>
      </span>
    </span>
  );
}
