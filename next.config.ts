import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // My Journey, Collection and the island became one page, My World.
  async redirects() {
    return ["/my-challenges", "/rewards", "/island"].map((source) => ({ source, destination: "/world", permanent: false }));
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
