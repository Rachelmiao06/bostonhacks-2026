// These tests drive the stats loading rules through useStats only, with no markup.
// A redesigned stats screen that keeps using the hook keeps these guarantees.
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sampleStats } from "./sample";
import { useStats } from "./useStats";

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));

function stubFetch(impl: () => Promise<Response>) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useStats", () => {
  it("starts loading", () => {
    stubFetch(() => new Promise(() => {}));
    const { result } = renderHook(() => useStats());
    expect(result.current.state.kind).toBe("loading");
  });

  it("shows live data when the route answers with the expected shape", async () => {
    stubFetch(() => json(sampleStats));
    const { result } = renderHook(() => useStats());
    await waitFor(() => expect(result.current.state.kind).toBe("live"));
  });

  it("still shows live data when the route has none of the newer optional fields", async () => {
    const older = JSON.parse(JSON.stringify(sampleStats));
    delete older.outages.openOverTime;
    delete older.riders.verifications;
    delete older.riders.confirmedWorkingPercent;
    delete older.riders.disputedFixes;
    delete older.dataNotes.fixesExcludedAsImprecise;
    stubFetch(() => json(older));
    const { result } = renderHook(() => useStats());
    await waitFor(() => expect(result.current.state.kind).toBe("live"));
  });

  it("falls back to labelled sample data when the route is missing (404)", async () => {
    stubFetch(() => json({}, 404));
    const { result } = renderHook(() => useStats());
    await waitFor(() => expect(result.current.state.kind).toBe("sample"));
    expect(result.current.state).toMatchObject({ kind: "sample", reason: "no_api", data: sampleStats });
  });

  it("falls back to labelled sample data when the database is not connected (503)", async () => {
    stubFetch(() => json({ error: "Database is not configured" }, 503));
    const { result } = renderHook(() => useStats());
    await waitFor(() => expect(result.current.state.kind).toBe("sample"));
    expect(result.current.state).toMatchObject({ reason: "no_database" });
  });

  it("shows an error, never sample numbers, for any other failure", async () => {
    for (const status of [400, 401, 500, 502, 504]) {
      stubFetch(() => json({}, status));
      const { result, unmount } = renderHook(() => useStats());
      await waitFor(() => expect(result.current.state.kind).toBe("error"));
      expect(result.current.state).not.toHaveProperty("data");
      unmount();
    }
  });

  it("shows an error for an answer that is not stats", async () => {
    stubFetch(() => json({ hello: "world" }));
    const { result } = renderHook(() => useStats());
    await waitFor(() => expect(result.current.state.kind).toBe("error"));
    expect(result.current.state).not.toHaveProperty("data");
  });

  it("shows an error when the answer is not JSON at all", async () => {
    stubFetch(() => Promise.resolve(new Response("<html>oops</html>", { status: 200 })));
    const { result } = renderHook(() => useStats());
    await waitFor(() => expect(result.current.state.kind).toBe("error"));
  });

  it("shows an error when the connection fails", async () => {
    stubFetch(() => Promise.reject(new TypeError("Failed to fetch")));
    const { result } = renderHook(() => useStats());
    await waitFor(() => expect(result.current.state.kind).toBe("error"));
    expect(result.current.state).not.toHaveProperty("data");
  });

  it("recovers on retry: loading again, then live", async () => {
    let calls = 0;
    const fetchMock = stubFetch(() => (++calls === 1 ? json({}, 500) : json(sampleStats)));
    const { result } = renderHook(() => useStats());
    await waitFor(() => expect(result.current.state.kind).toBe("error"));
    act(() => result.current.retry());
    expect(result.current.state.kind).toBe("loading");
    await waitFor(() => expect(result.current.state.kind).toBe("live"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith("/api/stats", expect.anything());
  });
});

describe("sample data", () => {
  it("is shaped like the real route, including a 91-day series", () => {
    expect(sampleStats.outages.openOverTime?.byDay).toHaveLength(91);
    expect(sampleStats.outages.timeToFix.windowDays).toBe(90);
    expect(sampleStats.dataNotes.sources.join(" ")).toMatch(/sample/i);
  });
});
