// Test-only helper: read the current stored state without React.
import { renderHook } from "@testing-library/react";
import { useAppState, type AppState } from "./storage";

export function getSnapshotForTest(): AppState {
  const { result, unmount } = renderHook(() => useAppState());
  const state = result.current;
  unmount();
  if (!state) throw new Error("storage not ready");
  return state;
}
