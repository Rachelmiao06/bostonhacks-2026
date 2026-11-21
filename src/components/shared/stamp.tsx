import { cn } from "@/lib/utils";

type Props = {
  /** Small top line, e.g. the category. */
  top: string;
  /** Big middle word, e.g. "Done" or a station short name. */
  middle: string;
  /** Optional bottom line, e.g. a date. */
  bottom?: string;
  /** Tailwind text + border colour classes, e.g. "text-cat-access border-cat-access". */
  tone: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES = {
  sm: "size-14 text-[0.5rem] [&_strong]:text-[0.7rem]",
  md: "size-20 text-[0.55rem] [&_strong]:text-sm",
  lg: "size-28 text-[0.65rem] [&_strong]:text-lg",
};

/** A round rubber stamp: double ring, slight tilt, ink-coloured text. Used for contributions and the collection. */
export function Stamp({ top, middle, bottom, tone, size = "md", className }: Props) {
  return (
    <span
      className={cn(
        "relative grid shrink-0 -rotate-12 place-items-center rounded-full border-[3px] border-double p-1 text-center font-ui leading-tight font-semibold tracking-[0.12em] uppercase",
        SIZES[size],
        tone,
        className,
      )}
    >
      <span className="flex flex-col items-center gap-0.5 px-1">
        <span className="line-clamp-1">{top}</span>
        <strong className="font-serif leading-none font-bold tracking-normal normal-case">{middle}</strong>
        {bottom && <span className="line-clamp-1 opacity-80">{bottom}</span>}
      </span>
    </span>
  );
}
