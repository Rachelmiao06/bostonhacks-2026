import { site } from "@/lib/config";

/** A quiet colophon. Hidden under the full-screen map on Explore. */
export function SiteFooter() {
  return (
    <footer className="border-t border-paper/10">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4 font-ui text-xs text-paper/70">
        <p>{site.name} · BostonHacks, Nov 21–22</p>
        <p>Community project. Not affiliated with the MBTA.</p>
      </div>
    </footer>
  );
}
