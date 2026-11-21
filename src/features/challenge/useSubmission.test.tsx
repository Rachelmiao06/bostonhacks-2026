// These tests drive the submit flow the way ANY screen would: through useSubmission only,
// with no markup. If a redesign keeps using the hook, these still describe what it must do.
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { settings } from "./content";
import { clearPhotos } from "./photo";
import * as review from "./review";
import { sampleQuests } from "./sample-quests";
import { reloadFromStorage, resetAll, tokenBalance, useAppState } from "./storage";
import { useSubmission } from "./useSubmission";

// jsdom's fake IndexedDB cannot store a File (it turns it into a plain object), so photo storage is
// replaced by a Map here. Validation and reading the file stay real. The real IndexedDB round trip
// is checked in a real browser (see README, "Checking a UI change").
const photoStore = vi.hoisted(() => ({
  map: new Map<string, Blob>(),
  failPut: false,
  /** Stand-in for shrinkPhoto: jsdom cannot draw images. null = use the real one (which returns the file unchanged here). */
  shrink: null as null | ((file: File) => Promise<File>),
  shrinkCalls: 0,
}));
vi.mock("./photo", async (importOriginal) => {
  const real = await importOriginal<typeof import("./photo")>();
  return {
    ...real,
    putPhoto: async (key: string, blob: Blob) => {
      if (photoStore.failPut) throw new Error("storage full");
      photoStore.map.set(key, blob);
    },
    getPhoto: async (key: string) => photoStore.map.get(key),
    deletePhoto: async (key: string) => {
      photoStore.map.delete(key);
    },
    clearPhotos: async () => {
      photoStore.map.clear();
    },
    shrinkPhoto: async (file: File) => {
      photoStore.shrinkCalls += 1;
      return photoStore.shrink ? photoStore.shrink(file) : real.shrinkPhoto(file);
    },
  };
});

const quest = sampleQuests[0];
const otherQuest = sampleQuests[1];

const VAGUE = "The elevator is bad.";
const SPECIFIC =
  "On Tuesday at 8:30am the Park Street elevator to the Red Line platform was out of service, so I had to carry my bike up the stairs and I was late for class. Please fix it quickly.";

function useFlow(q = quest) {
  const state = useAppState();
  if (!state) throw new Error("state not ready");
  return { ...useSubmission(q, state), tokens: tokenBalance(state), state };
}

const png = (name = "a.png", size = 20) => new File([new Uint8Array(size)], name, { type: "image/png" });

/** Simulates closing and reopening the page: storage survives, React state does not. */
function refresh() {
  reloadFromStorage();
}

beforeEach(async () => {
  localStorage.clear();
  resetAll();
  await clearPhotos();
  photoStore.failPut = false;
  photoStore.shrink = null;
  photoStore.shrinkCalls = 0;
  settings.practiceReviewDelayMs = 0;
  settings.requirePassToComplete = true;
  vi.restoreAllMocks();
});

describe("starting out", () => {
  it("locks Check until there is text or a photo", () => {
    const { result } = renderHook(() => useFlow());
    expect(result.current.status).toBe("empty");
    expect(result.current.canCheck).toBe(false);
    expect(result.current.canComplete).toBe(false);
    expect(result.current.hint).toBe("add_content");
  });

  it("unlocks Check once there is text, and saves the draft", () => {
    const { result } = renderHook(() => useFlow());
    act(() => result.current.setText(VAGUE));
    expect(result.current.canCheck).toBe(true);
    expect(result.current.status).toBe("draft");
    expect(result.current.hint).toBe("needs_check");
    expect(JSON.parse(localStorage.getItem("tparty:v1")!).submissions[quest.id].text).toBe(VAGUE);
  });

  it("treats whitespace as empty", () => {
    const { result } = renderHook(() => useFlow());
    act(() => result.current.setText("    "));
    expect(result.current.canCheck).toBe(false);
  });
});

describe("the AI check", () => {
  it("keeps Complete locked when the coach has suggestions", async () => {
    const { result } = renderHook(() => useFlow());
    act(() => result.current.setText(VAGUE));
    await act(() => result.current.check());
    expect(result.current.review?.result.status).toBe("needs_revision");
    expect(result.current.review?.isCurrent).toBe(true);
    expect(result.current.canComplete).toBe(false);
    expect(result.current.hint).toBe("needs_pass");
  });

  it("unlocks Complete when the coach is satisfied", async () => {
    const { result } = renderHook(() => useFlow());
    act(() => result.current.setText(SPECIFIC));
    await act(() => result.current.check());
    expect(result.current.status).toBe("reviewed");
    expect(result.current.canComplete).toBe(true);
    expect(result.current.hint).toBeNull();
  });

  it("makes the check out of date after ANY edit, and relocks Complete", async () => {
    const { result } = renderHook(() => useFlow());
    act(() => result.current.setText(SPECIFIC));
    await act(() => result.current.check());
    act(() => result.current.setText(SPECIFIC + " Thanks."));
    expect(result.current.review?.isCurrent).toBe(false);
    expect(result.current.canComplete).toBe(false);
    expect(result.current.hint).toBe("needs_check");
    expect(result.current.status).toBe("draft");
    await act(() => result.current.check());
    expect(result.current.canComplete).toBe(true);
  });

  it("keeps the player's text and allows a retry when the AI fails", async () => {
    vi.spyOn(review, "reviewDraft").mockRejectedValueOnce(new Error("network"));
    const { result } = renderHook(() => useFlow());
    act(() => result.current.setText(SPECIFIC));
    await act(() => result.current.check());
    expect(result.current.aiError).toBeTruthy();
    expect(result.current.text).toBe(SPECIFIC);
    expect(result.current.review).toBeNull();
    expect(result.current.canComplete).toBe(false); // a failure is never a pass
    expect(result.current.canCheck).toBe(true); // and can be retried
    await act(() => result.current.check());
    expect(result.current.aiError).toBeNull();
    expect(result.current.canComplete).toBe(true);
  });

  it("can follow the team setting that lets any checked draft complete", async () => {
    settings.requirePassToComplete = false;
    const { result } = renderHook(() => useFlow());
    act(() => result.current.setText(VAGUE));
    await act(() => result.current.check());
    expect(result.current.canComplete).toBe(true);
  });

  it("refuses to check an empty draft even if a screen calls check()", async () => {
    const spy = vi.spyOn(review, "reviewDraft");
    const { result } = renderHook(() => useFlow());
    await act(() => result.current.check());
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("completing", () => {
  async function completeIt(result: { current: ReturnType<typeof useFlow> }) {
    act(() => result.current.setText(SPECIFIC));
    await act(() => result.current.check());
    act(() => result.current.complete());
  }

  it("awards the tokens once and marks it completed in the app", async () => {
    const { result } = renderHook(() => useFlow());
    await completeIt(result);
    expect(result.current.completed).toBe(true);
    expect(result.current.status).toBe("completed_in_app");
    expect(result.current.tokens).toBe(quest.rewardTokens);
    expect(result.current.rewarded).toBe(true);
    act(() => result.current.complete());
    expect(result.current.tokens).toBe(quest.rewardTokens);
  });

  it("will not complete a draft that is locked", () => {
    const { result } = renderHook(() => useFlow());
    act(() => result.current.setText(VAGUE));
    act(() => result.current.complete());
    expect(result.current.completed).toBe(false);
    expect(result.current.tokens).toBe(0);
  });

  it("freezes the draft after completion", async () => {
    const { result } = renderHook(() => useFlow());
    await completeIt(result);
    act(() => result.current.setText("edited later"));
    expect(result.current.text).toBe(SPECIFIC);
    await act(() => result.current.pickPhoto(png()));
    expect(result.current.photo).toBeNull();
  });

  it("keeps quests separate and adds tokens per quest", async () => {
    const first = renderHook(() => useFlow(quest));
    await completeIt(first.result);
    const second = renderHook(() => useFlow(otherQuest));
    expect(second.result.current.completed).toBe(false);
    act(() => second.result.current.setText(SPECIFIC.replace("Park Street elevator", "Maverick escalator")));
    await act(() => second.result.current.check());
    act(() => second.result.current.complete());
    expect(second.result.current.tokens).toBe(quest.rewardTokens + otherQuest.rewardTokens);
  });
});

describe("refreshing the page", () => {
  it("brings back the draft, the check and its freshness", async () => {
    const first = renderHook(() => useFlow());
    act(() => first.result.current.setText(SPECIFIC));
    await act(() => first.result.current.check());
    first.unmount();

    refresh();
    const { result } = renderHook(() => useFlow());
    expect(result.current.text).toBe(SPECIFIC);
    expect(result.current.review?.isCurrent).toBe(true);
    expect(result.current.canComplete).toBe(true);
  });

  it("brings back a completed quest and its tokens without awarding again", async () => {
    const first = renderHook(() => useFlow());
    act(() => first.result.current.setText(SPECIFIC));
    await act(() => first.result.current.check());
    act(() => first.result.current.complete());
    first.unmount();

    refresh();
    const { result } = renderHook(() => useFlow());
    expect(result.current.completed).toBe(true);
    expect(result.current.tokens).toBe(quest.rewardTokens);
    act(() => result.current.complete());
    expect(result.current.tokens).toBe(quest.rewardTokens);
  });
});

describe("photos", () => {
  it("accepts one valid photo, saves it, and makes an earlier check out of date", async () => {
    const { result } = renderHook(() => useFlow());
    act(() => result.current.setText(SPECIFIC));
    await act(() => result.current.check());
    await act(() => result.current.pickPhoto(png("escalator.png")));
    expect(result.current.photo?.meta.fileName).toBe("escalator.png");
    expect(result.current.photo?.previewUrl).toMatch(/^data:/);
    expect(result.current.photoError).toBeNull();
    expect(result.current.review?.isCurrent).toBe(false);
    expect(result.current.canComplete).toBe(false);
  });

  it("rejects a wrong file type and an oversized photo with a message, keeping the old photo", async () => {
    const { result } = renderHook(() => useFlow());
    await act(() => result.current.pickPhoto(png("good.png")));
    await act(() => result.current.pickPhoto(new File(["x"], "n.txt", { type: "text/plain" })));
    expect(result.current.photoError).toMatch(/JPG, PNG or WebP/);
    expect(result.current.photo?.meta.fileName).toBe("good.png");
    await act(() => result.current.pickPhoto(png("huge.png", settings.maxPhotoBytes + 1)));
    expect(result.current.photoError).toMatch(/too large/i);
    expect(result.current.photo?.meta.fileName).toBe("good.png");
  });

  it("replaces the photo instead of adding a second one", async () => {
    const { result } = renderHook(() => useFlow());
    await act(() => result.current.pickPhoto(png("one.png")));
    await act(() => result.current.pickPhoto(png("two.png", 30)));
    expect(result.current.photo?.meta.fileName).toBe("two.png");
  });

  it("allows a photo with no text, and asks for a description", async () => {
    const { result } = renderHook(() => useFlow());
    await act(() => result.current.pickPhoto(png()));
    expect(result.current.canCheck).toBe(true);
    await act(() => result.current.check());
    expect(result.current.review?.result.photo?.ok).toBe(false);
    expect(result.current.canComplete).toBe(false);
  });

  it("removes the photo and relocks the check", async () => {
    const { result } = renderHook(() => useFlow());
    act(() => result.current.setText(SPECIFIC));
    await act(() => result.current.pickPhoto(png()));
    await act(() => result.current.check());
    await act(() => result.current.removePhoto());
    expect(result.current.photo).toBeNull();
    expect(result.current.review?.isCurrent).toBe(false);
  });

  it("says so plainly when the photo cannot be saved, and never pretends it was", async () => {
    photoStore.failPut = true;
    const { result } = renderHook(() => useFlow());
    act(() => result.current.setText(SPECIFIC));
    await act(() => result.current.pickPhoto(png("lost.png")));
    expect(result.current.photoError).toMatch(/could not be saved/i);
    expect(JSON.parse(localStorage.getItem("tparty:v1")!).submissions[quest.id].photo).toBeNull();
  });

  it("brings the saved photo back after a refresh", async () => {
    const first = renderHook(() => useFlow());
    act(() => first.result.current.setText(SPECIFIC));
    await act(() => first.result.current.pickPhoto(png("kept.png")));
    first.unmount();

    refresh();
    const { result } = renderHook(() => useFlow());
    await waitFor(() => expect(result.current.photo?.meta.fileName).toBe("kept.png"));
    expect(result.current.photo?.previewUrl).toMatch(/^data:/);
  });
});

describe("camera photos", () => {
  const tinyJpeg = async () => new File([new Uint8Array(5)], "photo.jpg", { type: "image/jpeg" });

  it("always re-saves a camera photo (smaller, no hidden location data)", async () => {
    photoStore.shrink = tinyJpeg;
    const { result } = renderHook(() => useFlow());
    await act(() => result.current.pickPhoto(png("IMG_0001.png", 50), { fromCamera: true }));
    expect(photoStore.shrinkCalls).toBe(1);
    expect(result.current.photo?.meta.fileName).toBe("photo.jpg");
    expect(result.current.photo?.meta.mimeType).toBe("image/jpeg");
    expect(result.current.photo?.meta.sizeBytes).toBe(5);
    expect(result.current.photoError).toBeNull();
  });

  it("leaves a small photo from the picker exactly as given", async () => {
    photoStore.shrink = tinyJpeg;
    const { result } = renderHook(() => useFlow());
    await act(() => result.current.pickPhoto(png("small.png", 50)));
    expect(photoStore.shrinkCalls).toBe(0);
    expect(result.current.photo?.meta.fileName).toBe("small.png");
    expect(result.current.photo?.meta.sizeBytes).toBe(50);
  });

  it("shrinks an oversized photo instead of rejecting it", async () => {
    photoStore.shrink = tinyJpeg;
    const { result } = renderHook(() => useFlow());
    await act(() => result.current.pickPhoto(png("huge.png", settings.maxPhotoBytes + 1)));
    expect(photoStore.shrinkCalls).toBe(1);
    expect(result.current.photo?.meta.fileName).toBe("photo.jpg");
    expect(result.current.photoError).toBeNull();
  });

  it("still says too large when shrinking cannot help", async () => {
    photoStore.shrink = async (file) => file; // browser could not re-save it
    const { result } = renderHook(() => useFlow());
    await act(() => result.current.pickPhoto(png("huge.png", settings.maxPhotoBytes + 1), { fromCamera: true }));
    expect(result.current.photoError).toMatch(/too large/i);
    expect(result.current.photo).toBeNull();
  });

  it("rejects a wrong file type from the camera input before doing any work", async () => {
    const { result } = renderHook(() => useFlow());
    await act(() => result.current.pickPhoto(new File(["x"], "n.gif", { type: "image/gif" }), { fromCamera: true }));
    expect(photoStore.shrinkCalls).toBe(0);
    expect(result.current.photoError).toMatch(/JPG, PNG or WebP/);
  });

  it("keeps the saved camera photo after a refresh", async () => {
    photoStore.shrink = tinyJpeg;
    const first = renderHook(() => useFlow());
    act(() => first.result.current.setText(SPECIFIC));
    await act(() => first.result.current.pickPhoto(png("IMG_0002.png", 50), { fromCamera: true }));
    first.unmount();
    reloadFromStorage();
    const { result } = renderHook(() => useFlow());
    await waitFor(() => expect(result.current.photo?.meta.fileName).toBe("photo.jpg"));
  });
});
