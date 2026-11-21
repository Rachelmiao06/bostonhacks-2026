"use client";

import { Stamp as StampIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { content } from "./content";

type Props = {
  station: string;
  likes: number;
  liked: boolean;
  /** Your own report: the count shows, but you cannot stamp it. */
  mine: boolean;
  busy: boolean;
  onStamp: () => void;
};

/** A small round stamp you press onto someone's report. Dashed and empty until pressed, then inked and tilted. */
export function LikeStamp({ station, likes, liked, mine, busy, onStamp }: Props) {
  const ring = (
    <span
      className={cn(
        "grid size-12 place-items-center rounded-full border-[3px] transition-transform duration-300 ease-out motion-reduce:transition-none",
        liked ? "-rotate-12 scale-100 border-double border-cat-verify text-cat-verify" : "scale-95 rotate-0 border-dashed border-graphite/25 text-taupe",
        !liked && !mine && "group-hover:scale-110 group-hover:border-cat-verify group-hover:text-cat-verify",
      )}
    >
      <StampIcon className="size-5" aria-hidden />
    </span>
  );
  const count = <span className="font-mono text-[0.65rem] text-taupe tabular-nums">{likes}</span>;

  if (mine) {
    return (
      <span className="flex shrink-0 flex-col items-center gap-0.5" title={content.likeCount(likes)}>
        <span className="grid size-12 place-items-center rounded-full border-[3px] border-double border-graphite/15 text-graphite/30">
          <StampIcon className="size-5" aria-hidden />
        </span>
        {count}
        <span className="sr-only">{content.likeCount(likes)}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onStamp}
      disabled={liked || busy}
      aria-pressed={liked}
      aria-label={liked ? content.stampedLabel(station) : content.stampLabel(station)}
      className="group flex shrink-0 cursor-pointer flex-col items-center gap-0.5 rounded-2xl p-1 outline-none focus-visible:ring-4 focus-visible:ring-graphite/20 disabled:cursor-default"
    >
      {ring}
      {count}
      <span className={cn("text-[0.6rem] font-medium", liked ? "text-cat-verify" : "text-taupe")}>{liked ? content.stamped : content.stampIt}</span>
    </button>
  );
}
