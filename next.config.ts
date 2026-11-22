import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // My Journey, Collection and the island became one page, My World.
  async redirects() {
    return ["/my-challenges", "/rewards", "/island"].map((source) => ({ source, destination: "/world", permanent: false }));
  },
  // My World's sounds and pictures never change under the same name for long: let the browser keep them for a day
  // (and reuse them for a week while it checks) instead of asking the server about each one on every visit.
  async headers() {
    return [{ source: "/assets/island/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
