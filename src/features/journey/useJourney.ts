"use client";

import { useMemo, useReducer } from "react";
import { layersFor } from "./layers";
import { initialState, reduce, type JourneyState, type Mode } from "./machine";
import { words } from "./content";

/**
 * The journey as a React hook. It holds the state and exposes one function per thing that can happen.
 * It draws nothing. Put it once at the top of the home screen and pass the result down.
 *
 * Who calls what (see README, "Wiring real data"):
 *  - the map calls `select` when a problem is tapped, `dismiss` when the rider leaves
 *  - the input area calls `draft` on every change
 *  - the report logic calls `reviewStarted` / `reviewResult` around the AI check and `completed` after the server saves
 *  - the sheet calls `commit` when the hold gesture completes
 */
export function useJourney(initial: JourneyState = initialState) {
  const [state, dispatch] = useReducer(reduce, initial);
  const layers = useMemo(() => layersFor(state), [state]);

  // dispatch is stable, so these never change identity and are safe in effect dependencies.
  const actions = useMemo(
    () => ({
      select: (questId: string, mode: Mode) => dispatch({ type: "select", questId, mode }),
      dismiss: () => dispatch({ type: "dismiss" }),
      draft: (hasContent: boolean) => dispatch({ type: "draft", hasContent }),
      reviewStarted: () => dispatch({ type: "review_started" }),
      reviewResult: (result: "passed" | "needs_work" | "failed") => dispatch({ type: "review_result", result }),
      commit: () => dispatch({ type: "commit" }),
      completed: (tokens: number) => dispatch({ type: "completed", tokens }),
      sendFailed: () => dispatch({ type: "send_failed" }),
      next: () => dispatch({ type: "next" }),
      reset: () => dispatch({ type: "reset" }),
    }),
    [],
  );

  return { state, layers, announce: words.stage[state.stage], ...actions };
}

export type JourneyApi = ReturnType<typeof useJourney>;
