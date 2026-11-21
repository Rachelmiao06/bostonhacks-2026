import Link from "next/link";
import { site } from "@/lib/config";
import { NavLinks } from "./nav-links";
import { Pawn } from "./pawn";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b-4 border-ink bg-board/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 outline-none focus-visible:ring-4 focus-visible:ring-sky/60 rounded-lg">
          <Pawn tone="sun" size={22} />
          <span className="max-sm:sr-only font-pixel text-[0.65rem] leading-none text-foreground">
            {site.name}
          </span>
        </Link>
        <NavLinks items={site.nav} />
      </nav>
    </header>
  );
}
