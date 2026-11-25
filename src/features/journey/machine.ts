/**
 * THE JOURNEY: one rider, one continuous surface, no page changes.
 *
 *   explore ──select──▶ focus ──type/photo──▶ drafting ──pause──▶ reviewing ─┬─passed────▶ ready ──hold──▶ sending ──▶ reward ──next──▶ explore
 *      ▲                  │                      ▲                           ├─needs work─▶ revising ─edit─▶ drafting
 *      └────dismiss───────┴──────────────────────┘                           └─failed─────▶ drafting (draft kept, retry)
 *
 * This file is pure: no React, no network, no words, no styling. It only answers "where is the rider in
 * the journey, and what can happen next". Screens read the state (and `layersFor` in layers.ts) and send
 * events. The report rules themselves (what counts as a pass, tokens) stay on the server and in
 * `features/challenge`; this machine only mirrors their outcomes.
 *
 * Events that make no sense in the current stage are ignored and return the SAME state object, so a late
 * network answer or a double tap can never corrupt the flow.
 */

export type Stage =
  | "explore" // the map, nothing chosen
  | "focus" // a problem is chosen and its card is open
  | "drafting" // the rider has started writing or added a photo
  | "reviewing" // the AI check is running
  | "revising" // the check asked for more
  | "ready" // the check passed; one gesture sends it
  | "sending" // the server is saving it
  | "reward"; // tokens earned, celebrating

/** report: describe what you see (goes through the AI check). verify: confirm a fix (one gesture, no check). */
export type Mode = "report" | "verify";

export type JourneyState = {
  stage: Stage;
  questId: string | null;
  mode: Mode | null;
  /** A draft the rider walked away from. The map can show a quiet mark on this quest. */
  parkedQuestId: string | null;
  /** Set when the last AI check could not run. The draft is kept and the rider can simply try again. */
  reviewFailed: boolean;
  /** Where to return if sending fails. */
  returnTo: "focus" | "ready" | null;
  reward: { questId: string; tokens: number } | null;
};

export type JourneyEvent =
  | { type: "select"; questId: string; mode: Mode }
  | { type: "dismiss" }
  /** The draft changed. `hasContent` is false when the rider emptied text and photo. */
  | { type: "draft"; hasContent: boolean }
  | { type: "review_started" }
  | { type: "review_result"; result: "passed" | "needs_work" | "failed" }
  | { type: "commit" }
  | { type: "completed"; tokens: number }
  | { type: "send_failed" }
  | { type: "next" }
  | { type: "reset" };

export const initialState: JourneyState = {
  stage: "explore",
  questId: null,
  mode: null,
  parkedQuestId: null,
  reviewFailed: false,
  returnTo: null,
  reward: null,
};

/** Stages where the rider has written something worth keeping. */
const HAS_DRAFT: ReadonlySet<Stage> = new Set(["drafting", "reviewing", "revising", "ready"]);

export function reduce(state: JourneyState, event: JourneyEvent): JourneyState {
  switch (event.type) {
    case "select": {
      if (state.stage === "reviewing" || state.stage === "sending") return state; // finish what is running
      if (state.questId === event.questId && state.stage !== "reward") return state;
      // Switching away from a draft parks it instead of throwing it away.
      const parked = state.questId && HAS_DRAFT.has(state.stage) ? state.questId : state.parkedQuestId;
      return {
        ...initialState,
        stage: "focus",
        questId: event.questId,
        mode: event.mode,
        parkedQuestId: parked === event.questId ? null : parked,
      };
    }

    case "dismiss": {
      if (state.stage === "explore" || state.stage === "reviewing" || state.stage === "sending") return state;
      if (state.stage === "reward") return { ...initialState, parkedQuestId: state.parkedQuestId };
      const parked = HAS_DRAFT.has(state.stage) ? state.questId : state.parkedQuestId;
      return { ...initialState, parkedQuestId: parked };
    }

    case "draft": {
      if (state.mode !== "report") return state; // a verify has no draft
      switch (state.stage) {
        case "focus":
          return event.hasContent ? { ...state, stage: "drafting", reviewFailed: false } : state;
        case "drafting":
          return event.hasContent ? state : { ...state, stage: "focus", reviewFailed: false };
        // Any edit after a check makes that check out of date, even one made while it runs.
        case "reviewing":
        case "revising":
        case "ready":
          return { ...state, stage: event.hasContent ? "drafting" : "focus", reviewFailed: false };
        default:
          return state;
      }
    }

    case "review_started":
      return state.stage === "drafting" ? { ...state, stage: "reviewing", reviewFailed: false } : state;

    case "review_result": {
      if (state.stage !== "reviewing") return state; // stale answer: the draft changed meanwhile
      if (event.result === "passed") return { ...state, stage: "ready" };
      if (event.result === "needs_work") return { ...state, stage: "revising" };
      return { ...state, stage: "drafting", reviewFailed: true };
    }

    case "commit": {
      if (state.stage === "ready") return { ...state, stage: "sending", returnTo: "ready" };
      if (state.stage === "focus" && state.mode === "verify") return { ...state, stage: "sending", returnTo: "focus" };
      return state;
    }

    case "completed": {
      if (state.stage !== "sending" || !state.questId) return state;
      return {
        ...initialState,
        stage: "reward",
        questId: state.questId,
        mode: state.mode,
        parkedQuestId: state.parkedQuestId === state.questId ? null : state.parkedQuestId,
        reward: { questId: state.questId, tokens: event.tokens },
      };
    }

    case "send_failed":
      return state.stage === "sending" && state.returnTo ? { ...state, stage: state.returnTo, returnTo: null } : state;

    case "next":
      return state.stage === "reward" ? { ...initialState, parkedQuestId: state.parkedQuestId } : state;

    case "reset":
      return initialState;
  }
}
