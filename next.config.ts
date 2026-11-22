import type { NextConfig } from "next";

// Baseline browser protections on every response. Camera and location stay allowed for our own pages only (Report and Explore use them).
// The Content-Security-Policy here is deliberately partial: it blocks framing, plugins and base-tag tricks, but sets no script-src,
// because the map, the 3D island and Next's own scripts would need a tested allowlist. Do not describe it as a full CSP.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=(), payment=(), usb=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
