"use client";

import { cn } from "@/lib/utils";

// Small atlas-style controls used inside the map panel. Thin outlines, no solid offset edges.

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "solid" | "outline" | "ghost";
  /** Tailwind bg class for a solid button in a category colour, e.g. "bg-cat-verify". */
  fill?: string;
  size?: "sm" | "md" | "lg";
};

export function AtlasButton({ tone = "solid", fill, size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-ui font-medium whitespace-nowrap outline-none transition-[opacity,background-color,color] focus-visible:ring-4 focus-visible:ring-graphite/25 disabled:cursor-not-allowed",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-5 text-[0.95rem]",
        tone === "solid" && cn(fill ?? "bg-graphite", "text-ivory hover:opacity-90 disabled:bg-stone-deep disabled:text-taupe disabled:opacity-100"),
        tone === "outline" && "border border-graphite/25 bg-ivory text-graphite hover:bg-stone disabled:opacity-40",
        tone === "ghost" && "text-taupe hover:bg-stone-deep/60 hover:text-graphite disabled:opacity-40",
        className,
      )}
    />
  );
}

export function AtlasTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full resize-y rounded-xl border border-graphite/20 bg-ivory p-3.5 font-ui text-[0.95rem] leading-relaxed text-graphite outline-none placeholder:text-taupe/80 focus-visible:border-graphite/50 focus-visible:ring-4 focus-visible:ring-graphite/10 aria-invalid:border-cat-service",
        className,
      )}
    />
  );
}

/** Small uppercase label in the ticket's typewriter style. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("font-mono text-[0.62rem] tracking-[0.14em] text-taupe uppercase", className)}>{children}</p>;
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-cat-service/30 bg-cat-service/8 px-3.5 py-2.5 font-ui text-sm text-cat-service">
      {children}
    </p>
  );
}
