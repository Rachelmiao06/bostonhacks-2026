"use client";

import dynamic from "next/dynamic";
import { content } from "./content";

// MapLibre needs the browser (WebGL, window), so the map is never rendered on the server.
// Next.js only allows `ssr: false` inside a Client Component, which is why this small file exists.
const ExploreMap = dynamic(() => import("./ExploreMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[70dvh] min-h-96 place-items-center rounded-2xl border-2 border-ink bg-paper font-pixel text-[0.6rem] text-ink shadow-tile">
      {content.loading}
    </div>
  ),
});

export function ExploreLoader() {
  return <ExploreMap />;
}
