import { cn } from "@/lib/utils";

type RibbonProps = {
  children: React.ReactNode;
  tone?: "cherry" | "sun" | "leaf" | "sky";
  className?: string;
};

const TONES = {
  cherry: "bg-cherry text-paper",
  sun: "bg-sun text-ink",
  leaf: "bg-leaf text-ink",
  sky: "bg-sky text-ink",
} as const;

/** A tilted banner label, like the red ribbon on the cover art. */
export function Ribbon({ children, tone = "cherry", className }: RibbonProps) {
  return (
    <span
      className={cn(
        "inline-block -rotate-2 border-2 border-ink px-6 py-2.5 font-pixel text-[0.65rem] leading-relaxed shadow-chip sm:text-xs",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
