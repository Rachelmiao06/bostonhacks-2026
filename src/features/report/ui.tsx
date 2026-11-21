// Small Tada-styled pieces for the Report screens: warm stone and ivory, thin outlines, restrained glass.
// Colours come only from theme tokens in globals.css.
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Subtle entrance. Switched off for people who ask for reduced motion. */
export const enter = "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200";

/** A compact floating ticket: ivory glass with a hairline edge. */
export function Panel({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-3xl border border-hairline bg-ivory/90 p-4 shadow-float backdrop-blur-md sm:p-5", enter, className)} {...p} />;
}

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[0.95rem] font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-graphite/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory disabled:pointer-events-none disabled:opacity-50";

export function PrimaryButton({ className, ...p }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={cn(base, "bg-graphite text-ivory hover:bg-graphite/90", className)} {...p} />;
}

export function SecondaryButton({ className, ...p }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={cn(base, "border border-hairline bg-ivory text-graphite hover:bg-stone-deep/50", className)} {...p} />;
}

export function Chip({ tone = "quiet", className, children }: { tone?: "quiet" | "go" | "warn"; className?: string; children: ReactNode }) {
  const tones = { quiet: "bg-stone-deep/60 text-graphite", go: "bg-sage text-graphite", warn: "bg-cherry/15 text-graphite" };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", tones[tone], className)}>{children}</span>;
}

/** Progressive disclosure: secondary detail stays closed until asked for. */
export function Disclosure({ summary, children, className }: { summary: ReactNode; children: ReactNode; className?: string }) {
  return (
    <details className={cn("group text-sm", className)}>
      <summary className="cursor-pointer list-none rounded-lg py-1 text-taupe underline-offset-4 outline-none hover:text-graphite hover:underline focus-visible:ring-2 focus-visible:ring-graphite/40 [&::-webkit-details-marker]:hidden">
        {summary}
      </summary>
      <div className="mt-2 grid gap-2 text-taupe">{children}</div>
    </details>
  );
}

export const field =
  "w-full rounded-xl border border-hairline bg-ivory px-3 py-2 text-graphite outline-none focus-visible:ring-2 focus-visible:ring-graphite/40";
