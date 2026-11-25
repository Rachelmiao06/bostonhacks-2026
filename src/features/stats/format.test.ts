import { describe, expect, it } from "vitest";
import { barPercent, formatDate, formatDay, formatHours, formatMonth, formatPercent, kindLabel } from "./format";

describe("formatHours", () => {
  it("shows hours under two days and days after", () => {
    expect(formatHours(5)).toBe("5 h");
    expect(formatHours(47.9)).toBe("47.9 h");
    expect(formatHours(48)).toBe("2 days");
    expect(formatHours(72)).toBe("3 days");
    expect(formatHours(36)).toBe("36 h");
  });
  it("says no data for null instead of a fake number", () => {
    expect(formatHours(null)).toBe("no data");
  });
});

describe("formatPercent", () => {
  it("shows a percent, and no data yet for null (never 0%)", () => {
    expect(formatPercent(25)).toBe("25%");
    expect(formatPercent(0)).toBe("0%");
    expect(formatPercent(null)).toBe("no data yet");
  });
});

describe("dates", () => {
  it("formats a month and a day without time zone drift", () => {
    expect(formatMonth("2026-06")).toBe("Jun 2026");
    expect(formatMonth("2026-12")).toBe("Dec 2026");
    expect(formatDay("2026-10-03")).toBe("Oct 3");
    expect(formatDay("2026-01-01")).toBe("Jan 1");
  });
  it("hands back text it cannot read instead of crashing", () => {
    expect(formatMonth("nope")).toBe("nope");
    expect(formatDay("nope")).toBe("nope");
    expect(formatDate(null)).toBe("unknown");
    expect(formatDate("not a date")).toBe("unknown");
  });
  it("formats a real timestamp in Boston time", () => {
    expect(formatDate("2026-11-21T12:00:00.000Z")).toBe("Nov 21, 2026");
  });
});

describe("barPercent", () => {
  it("scales to the biggest value", () => {
    expect(barPercent(50, 100)).toBe(50);
    expect(barPercent(100, 100)).toBe(100);
  });
  it("keeps a small non-zero value visible and a zero value empty", () => {
    expect(barPercent(1, 1000)).toBe(3);
    expect(barPercent(0, 100)).toBe(0);
    expect(barPercent(5, 0)).toBe(0);
  });
});

describe("kindLabel", () => {
  it("names the kinds and passes unknown ones through", () => {
    expect(kindLabel("elevator")).toBe("Elevators");
    expect(kindLabel("escalator")).toBe("Escalators");
    expect(kindLabel("access")).toBe("Access issues");
    expect(kindLabel("ramp")).toBe("ramp");
  });
});
