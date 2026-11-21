"use client";

import dynamic from "next/dynamic";
import { content } from "./content";

// MapLibre needs the browser (WebGL, window), so the map is never rendered on the server.
// Next.js only allows `ssr: false` inside a Client Component, which is why this small file exists.
const ExploreMap = dynamic(() => import("./ExploreMap"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-30 grid place-items-center bg-stone font-ui text-sm text-taupe">
      {content.loading}
    </div>
  ),
});

export function ExploreLoader() {
  return <ExploreMap />;
}
