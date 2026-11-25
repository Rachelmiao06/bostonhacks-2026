// The nav is data (site.nav). Whatever the UI looks like, every tab must lead to a real page.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { site } from "./config";

const appDir = join(process.cwd(), "src", "app");

describe("site.nav", () => {
  it("has no empty or duplicate tabs", () => {
    const hrefs = site.nav.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const item of site.nav) {
      expect(item.label.trim()).not.toBe("");
      expect(item.href.startsWith("/")).toBe(true);
    }
  });

  it("points every tab at a page that exists", () => {
    for (const item of site.nav) {
      const page = item.href === "/" ? join(appDir, "page.tsx") : join(appDir, ...item.href.split("/").filter(Boolean), "page.tsx");
      expect(existsSync(page), `${item.label} (${item.href}) has no page at ${page}`).toBe(true);
    }
  });
});
