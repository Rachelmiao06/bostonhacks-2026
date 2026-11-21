"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string };

export function NavLinks({ items }: { items: Item[] }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full border-2 px-3.5 py-1.5 font-heading text-sm font-bold transition-[transform,box-shadow,background-color] duration-150 outline-none focus-visible:ring-4 focus-visible:ring-sky/60 sm:px-5 sm:text-base",
              active
                ? "translate-y-[3px] border-ink bg-sun text-ink"
                : "border-ink bg-paper text-ink shadow-chip hover:-translate-y-0.5 hover:shadow-chip-lift active:translate-y-[3px] active:shadow-none",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
