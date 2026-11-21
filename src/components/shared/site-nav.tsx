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
        className="pointer-events-auto mx-auto flex max-w-5xl items-center justify-between gap-1 rounded-full border border-ivory/80 bg-gradient-to-br from-ivory/80 via-ivory/60 to-ivory/45 py-1 pr-1.5 pl-3 font-ui text-graphite backdrop-blur-xl backdrop-saturate-[1.8] sm:gap-3 sm:pl-4"
        // The same frosted glass as the welcome card: a bright rim on top and a soft shadow that lifts it off the map.
        style={{
          boxShadow:
            "inset 0 1.5px 0 var(--ivory), inset 0 -1px 0 color-mix(in oklab, var(--ivory) 40%, transparent), 0 10px 24px -14px color-mix(in oklab, var(--graphite) 38%, transparent), 0 1px 3px color-mix(in oklab, var(--graphite) 10%, transparent)",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg py-1 pr-1 outline-none focus-visible:ring-2 focus-visible:ring-graphite/40"
        >
          <PixelTrain size={26} />
          <span className="font-heading text-lg leading-none font-semibold max-sm:sr-only">{site.name}</span>
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
