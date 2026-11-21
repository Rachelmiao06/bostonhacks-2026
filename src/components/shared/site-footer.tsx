import { site } from "@/lib/config";

/** A quiet colophon. Hidden under the full-screen map on Explore. */
export function SiteFooter() {
  return (
    <footer className="border-t border-dashed border-hairline">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4 font-ui text-xs text-taupe">
        <p>{site.name} · BostonHacks, Nov 21–22</p>
        <p>Community project. Not affiliated with the MBTA.</p>
      </div>
    </footer>
  );
}
