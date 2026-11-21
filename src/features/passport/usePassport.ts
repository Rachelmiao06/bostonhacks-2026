"use client";

import { useSearchParams } from "next/navigation";
import { useMyProgress, type MyProgress } from "@/features/explore/progress";
import { demoProgress, type DemoLevel } from "./sample";

export type PassportState =
  | { status: "loading" }
  | { status: "offline" }
  | { status: "ready"; data: MyProgress; demo: DemoLevel | null };

const levels: readonly string[] = ["empty", "some", "full"];

/**
 * The one place that decides where the passport's numbers come from: the rider's real progress,
 * or made-up numbers when the address says `?demo=empty|some|full`. The screen never knows which.
 */
export function usePassport(): PassportState {
  const real = useMyProgress();
  const asked = useSearchParams().get("demo");
  const demo = asked && levels.includes(asked) ? (asked as DemoLevel) : null;

  if (demo) return { status: "ready", data: demoProgress(demo), demo };
  if (real.status === "ready") return { status: "ready", data: real.data, demo: null };
  return real.status === "loading" ? { status: "loading" } : { status: "offline" };
}
