"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";
import { PixelTrain } from "@/components/shared/pixel-train";
import { categoryStyle } from "./category";
import { categories, content, world, type CategoryId } from "./content";
import { stampCount, useMyProgress } from "./progress";

type FilterProps = {
  counts: Record<CategoryId, number>;
  show: ReadonlySet<CategoryId>;
  onToggle: (id: CategoryId | "all") => void;
};

/** Category chips with live counts. Tapping one shows only that kind; tapping it again shows everything. */
export function FilterBar({ counts, show, onToggle }: FilterProps) {
  const all = show.size === categories.length;
  return (
    <div
      role="toolbar"
      aria-label={content.filters.label}
      className="flex max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-hairline bg-ivory/92 p-1 font-ui shadow-float backdrop-blur-md [scrollbar-width:none]"
    >
      <Chip active={all} onClick={() => onToggle("all")}>
        {content.filters.all}
        <Count>{Object.values(counts).reduce((a, b) => a + b, 0)}</Count>
      </Chip>
      {categories.map((c) => {
        const style = categoryStyle[c.id];
        const Icon = style.icon;
        return (
          <Chip key={c.id} active={!all && show.has(c.id)} onClick={() => onToggle(c.id)}>
            <Icon className={cn("size-3.5", style.text)} aria-hidden />
            <span className="sm:hidden">{c.short}</span>
            <span className="max-sm:hidden">{c.label}</span>
            <Count>{counts[c.id]}</Count>
          </Chip>
        );
      })}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-graphite/30",
        active ? "bg-stone-deep text-graphite" : "text-taupe hover:bg-stone-deep/50 hover:text-graphite",
      )}
    >
      {children}
    </button>
  );
}

const Count = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono text-[0.65rem] text-taupe tabular-nums">{children}</span>
);

/** The rider's real stamps and tokens from /api/submissions. Hidden when that data is unavailable. */
export function ProgressChip() {
  const progress = useMyProgress();
  if (progress.status !== "ready") return null;
  return (
    <Link
      href="/rewards"
      aria-label={`${content.progress.title}: ${content.progress.label(stampCount(progress.data), progress.data.tokenBalance)}`}
      className="flex items-center gap-2 rounded-2xl border border-hairline bg-ivory/92 py-1.5 pr-3 pl-2 font-ui text-xs font-medium text-graphite shadow-float backdrop-blur-md outline-none hover:bg-ivory focus-visible:ring-2 focus-visible:ring-graphite/30"
    >
      <PixelTrain size={22} body="fill-cat-verify" />
      <span className="font-pixel text-[0.5rem] leading-none tracking-tight">
        {content.progress.label(stampCount(progress.data), progress.data.tokenBalance)}
      </span>
    </Link>
  );
}

/** A small "what are these pins?" key, closed by default so it never covers the map. */
export function PinLegend() {
  const [open, setOpen] = useState(false);
  const text = world.legend;
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pointer-events-auto flex cursor-pointer items-center gap-1.5 rounded-full border border-hairline bg-ivory/92 px-2.5 py-1 font-ui text-[0.68rem] font-medium text-graphite shadow-float backdrop-blur-md outline-none hover:bg-ivory focus-visible:ring-2 focus-visible:ring-graphite/30"
      >
        <CircleHelp className="size-3.5" aria-hidden />
        {text.open}
      </button>
    );
  }
  return (
    <div role="region" aria-label={text.title} className="pointer-events-auto w-64 space-y-2 rounded-2xl border border-hairline bg-ivory/95 p-3 font-ui shadow-float backdrop-blur-md">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[0.62rem] tracking-[0.14em] text-taupe uppercase">{text.title}</p>
        <button type="button" onClick={() => setOpen(false)} className="cursor-pointer text-xs text-taupe underline underline-offset-4 outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/30">
          {text.close}
        </button>
      </div>
      <ul className="space-y-1.5">
        {categories.map((c) => {
          const style = categoryStyle[c.id];
          const Icon = style.icon;
          return (
            <li key={c.id} className="flex items-center gap-2 text-xs text-graphite">
              <Icon className={cn("size-3.5 shrink-0", style.text)} aria-hidden />
              {c.label}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-taupe">{text.number}</p>
      <p className="text-xs text-taupe">{text.landmark}</p>
      <p className="text-xs text-taupe">{text.ring}</p>
    </div>
  );
}

/** Small status line: live trains, or a saved copy. */
export function StatusChip({ live, children }: { live: boolean; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 rounded-full border border-hairline bg-ivory/92 px-2.5 py-1 font-ui text-[0.68rem] text-taupe shadow-float backdrop-blur-md">
      <span className={cn("size-1.5 rounded-full", live ? "animate-pulse bg-cat-verify" : "bg-taupe")} />
      {children}
    </p>
  );
}
