"use client";

import dynamic from "next/dynamic";
import { content } from "./content";

// three.js needs the browser (WebGL, window), so the island never renders on the server.
export const IslandScene = dynamic(() => import("./IslandScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center font-pixel text-[0.6rem] text-ink">{content.loading}</div>
  ),
});
