import { cn } from "@/lib/utils";

// Little planner stickers for the journal. Drawn from the site's colour tokens only. Each has a thick ivory outline and a soft
// shadow, like a die-cut sticker; they are decoration, so they are hidden from screen readers (the entry text says the same).
const sticker = "drop-shadow-[0_1px_1px_var(--shade-soft)]";

/** A star: a report that was completed in Tada. */
export function StarSticker({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-5", sticker, className)}>
      <path d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17l-5.7 3.1 1.2-6.4L2.8 9.3l6.4-.8z" className="fill-cat-station stroke-ivory" strokeWidth="2.4" strokeLinejoin="round" paintOrder="stroke" />
      <path d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17l-5.7 3.1 1.2-6.4L2.8 9.3l6.4-.8z" className="fill-cat-station/80" />
    </svg>
  );
}

/** A heart: other riders liked the report. */
export function HeartSticker({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-5", sticker, className)}>
      <path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.800-8 11-8 11z" className="fill-cat-service stroke-ivory" strokeWidth="2.4" strokeLinejoin="round" paintOrder="stroke" />
      <path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.800-8 11-8 11z" className="fill-cat-service/85" />
    </svg>
  );
}

/** A little folder with a face: a report that is not finished yet. */
export function FolderSticker({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-5", sticker, className)}>
      <path d="M3.5 6.500a1.500 1.500 0 0 1 1.500-1.500h4.200l1.800 2H19a1.500 1.500 0 0 1 1.500 1.500v9A1.500 1.500 0 0 1 19 19H5a1.500 1.500 0 0 1-1.500-1.500z" className="fill-cat-access stroke-ivory" strokeWidth="2.4" strokeLinejoin="round" paintOrder="stroke" />
      <path d="M3.5 6.500a1.500 1.500 0 0 1 1.500-1.500h4.200l1.800 2H19a1.500 1.500 0 0 1 1.500 1.500v9A1.500 1.500 0 0 1 19 19H5a1.500 1.500 0 0 1-1.500-1.500z" className="fill-cat-access/25" />
      <circle cx="9.500" cy="12.500" r="1" className="fill-graphite" />
      <circle cx="14.500" cy="12.500" r="1" className="fill-graphite" />
      <path d="M10 15.200q2 1.600 4 0" className="fill-none stroke-graphite" strokeWidth="1.100" strokeLinecap="round" />
      <circle cx="7.600" cy="14.600" r="1.100" className="fill-cat-service" opacity=".25" />
      <circle cx="16.400" cy="14.600" r="1.100" className="fill-cat-service" opacity=".25" />
    </svg>
  );
}

/** A green "CHECK" ribbon (the fix works again) or a red one (still broken), like the labels in a planner. */
export function CheckTag({ ok, label, className }: { ok: boolean; label: string; className?: string }) {
  return (
    <span aria-hidden className={cn("inline-flex items-center gap-0.5 rounded-[3px] px-1 py-0.5 font-pixel text-[0.4rem] leading-none text-ivory", sticker, ok ? "bg-cat-verify" : "bg-cat-service", className)}>
      {label}
      <span>{ok ? "✓" : "!"}</span>
    </span>
  );
}
