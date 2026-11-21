import { Suspense } from "react";
import Link from "next/link";
import { site } from "@/lib/config";
import { MoreMenu, NavLinks } from "./nav-links";
import { PixelTrain } from "./pixel-train";

/**
 * A slim floating bar. On the map it hovers over the city; on other pages it sits at the top.
 * The links read the current path, so they sit inside Suspense (Cache Components needs that on dynamic routes).
 */
export function SiteNav() {
  return (
    <header className="pointer-events-none sticky top-0 z-40 px-2 pt-2 sm:px-4 sm:pt-3">
      <nav
        aria-label="Main"
        className="cloth-nav relative pointer-events-auto mx-auto flex max-w-5xl items-center justify-between gap-1 rounded-2xl border border-hairline bg-ivory/92 py-1 pr-1 pl-2 font-ui text-graphite shadow-float backdrop-blur-md sm:gap-3 sm:pl-3"
      >
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg py-1 pr-1 outline-none focus-visible:ring-2 focus-visible:ring-graphite/40"
        >
          <PixelTrain size={26} />
          <span className="font-serif text-lg leading-none font-semibold tracking-tight max-sm:sr-only">{site.name}</span>
        </Link>
        <div className="flex items-center">
          <Suspense fallback={<NavLinks items={site.nav} pathname={null} />}>
            <NavLinks items={site.nav} />
          </Suspense>
          <MoreMenu items={site.moreNav} />
        </div>
      </nav>
    </header>
  );
}
