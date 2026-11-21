import type { JourneyState } from "./machine";

/**
 * WHAT IS VISIBLE AT EACH STAGE. The one contract between the flow and any screen.
 *
 * A screen has three layers on one surface: the map (always there), a sheet that rises from the bottom,
 * and a short overlay for the reward. There are no pages and no tabs. `layersFor` says which layers are
 * showing and how; the screen decides how that looks.
 */
export type Layers = {
  /** The map is always mounted. "dimmed" while a sheet is open so the eye goes to the sheet. */
  map: "full" | "dimmed";
  /** hidden: gone. peek: only the glyph row. open: glyphs plus the input. */
  sheet: "hidden" | "peek" | "open";
  overlay: "none" | "reward";
  /** Whether the rider can type or add a photo. */
  input: "none" | "enabled" | "locked";
  /** One wordless status signal for colour, ring or icon. */
  status: "none" | "pending" | "needs_work" | "passed" | "failed" | "sending";
  /** Which gestures are live right now. The screen draws no button for them. `retry` is live after a check that could not run. */
  gestures: { commit: boolean; dismiss: boolean; retry: boolean };
};

export function layersFor(state: JourneyState): Layers {
  const verify = state.mode === "verify";
  switch (state.stage) {
    case "explore":
      return { map: "full", sheet: "hidden", overlay: "none", input: "none", status: "none", gestures: { commit: false, dismiss: false, retry: false } };
    case "focus":
      return {
        map: "dimmed",
        sheet: verify ? "peek" : "open",
        overlay: "none",
        input: verify ? "none" : "enabled",
        status: "none",
        gestures: { commit: verify, dismiss: true, retry: false },
      };
    case "drafting":
      return {
        map: "dimmed",
        sheet: "open",
        overlay: "none",
        input: "enabled",
        status: state.reviewFailed ? "failed" : "none",
        gestures: { commit: false, dismiss: true, retry: state.reviewFailed },
      };
    case "reviewing":
      return { map: "dimmed", sheet: "open", overlay: "none", input: "enabled", status: "pending", gestures: { commit: false, dismiss: false, retry: false } };
    case "revising":
      return { map: "dimmed", sheet: "open", overlay: "none", input: "enabled", status: "needs_work", gestures: { commit: false, dismiss: true, retry: false } };
    case "ready":
      return { map: "dimmed", sheet: "open", overlay: "none", input: "enabled", status: "passed", gestures: { commit: true, dismiss: true, retry: false } };
    case "sending":
      return { map: "dimmed", sheet: verify ? "peek" : "open", overlay: "none", input: "locked", status: "sending", gestures: { commit: false, dismiss: false, retry: false } };
    case "reward":
      return { map: "dimmed", sheet: "hidden", overlay: "reward", input: "none", status: "none", gestures: { commit: false, dismiss: true, retry: false } };
  }
}
