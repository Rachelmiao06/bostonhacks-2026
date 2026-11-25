import { beforeEach, describe, expect, it } from "vitest";
import { settings } from "./content";
import { metaFor, validatePhoto } from "./photo";
import { reviewDraft } from "./review";
import { sampleQuests } from "./sample-quests";
import {
  completeQuest,
  draftSignature,
  reloadFromStorage,
  resetAll,
  saveDraft,
  saveReview,
  submissionStatus,
  tokenBalance,
} from "./storage";
import { getSnapshotForTest } from "./test-helpers";

const quest = sampleQuests[0];

const VAGUE = "The elevator is bad.";
const SPECIFIC =
  "On Tuesday at 8:30am the Park Street elevator to the Red Line platform was out of service, so I had to carry my bike up the stairs and I was late for class. Please fix it quickly.";

beforeEach(() => {
  localStorage.clear();
  resetAll();
  settings.practiceReviewDelayMs = 0;
});

describe("practice review", () => {
  it("asks a vague note for more detail and does not pass it", async () => {
    const r = await reviewDraft({ quest, text: VAGUE, hasPhoto: false });
    expect(r.status).toBe("needs_revision");
    expect(r.specificity.ok).toBe(false);
    expect(r.completeness.ok).toBe(false);
    expect(r.photo).toBeNull();
    expect(r.suggestions.length).toBeGreaterThan(0);
  });

  it("passes a specific, relevant note", async () => {
    const r = await reviewDraft({ quest, text: SPECIFIC, hasPhoto: false });
    expect(r.status).toBe("reviewed");
    expect(r.suggestions).toEqual([]);
  });

  it("flags an off-topic note as not relevant", async () => {
    const r = await reviewDraft({ quest, text: "I love sandwiches and sunny days at the beach.", hasPhoto: false });
    expect(r.relevance.ok).toBe(false);
    expect(r.status).toBe("needs_revision");
  });

  it("asks for a description when only a photo is given", async () => {
    const r = await reviewDraft({ quest, text: "", hasPhoto: true });
    expect(r.photo?.ok).toBe(false);
    expect(r.status).toBe("needs_revision");
  });

  it("never treats a photo as proof", async () => {
    const r = await reviewDraft({ quest, text: SPECIFIC, hasPhoto: true });
    expect(r.photo?.note).toMatch(/never treated as proof/i);
  });
});

describe("photo validation", () => {
  const file = (name: string, type: string, size = 10) =>
    new File([new Uint8Array(size)], name, { type });

  it("accepts JPG, PNG and WebP", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(validatePhoto(file("a", type))).toBeNull();
    }
  });

  it("rejects other types", () => {
    expect(validatePhoto(file("a.gif", "image/gif"))).toMatch(/JPG, PNG or WebP/);
    expect(validatePhoto(file("a.txt", "text/plain"))).not.toBeNull();
  });

  it("rejects photos over the size limit", () => {
    expect(validatePhoto(file("big.png", "image/png", settings.maxPhotoBytes + 1))).toMatch(/too large/i);
  });

  it("changes the signature when the photo changes", () => {
    expect(metaFor(file("a.png", "image/png", 10)).signature).not.toBe(metaFor(file("a.png", "image/png", 11)).signature);
  });
});

describe("storage", () => {
  it("keeps a draft across a page reload", () => {
    saveDraft(quest.id, { text: VAGUE, photo: null });
    reloadFromStorage();
    expect(getSnapshotForTest().submissions[quest.id].text).toBe(VAGUE);
  });

  it("drops a draft that is emptied", () => {
    saveDraft(quest.id, { text: VAGUE, photo: null });
    saveDraft(quest.id, { text: "  ", photo: null });
    expect(getSnapshotForTest().submissions[quest.id]).toBeUndefined();
  });

  it("awards tokens once per quest", async () => {
    saveDraft(quest.id, { text: SPECIFIC, photo: null });
    completeQuest(quest);
    completeQuest(quest);
    expect(tokenBalance(getSnapshotForTest())).toBe(quest.rewardTokens);
    expect(getSnapshotForTest().rewards).toHaveLength(1);
  });

  it("does not award tokens for a quest that was never started", () => {
    completeQuest(quest);
    expect(tokenBalance(getSnapshotForTest())).toBe(0);
  });

  it("freezes a completed draft", () => {
    saveDraft(quest.id, { text: SPECIFIC, photo: null });
    completeQuest(quest);
    saveDraft(quest.id, { text: "changed after completing", photo: null });
    expect(getSnapshotForTest().submissions[quest.id].text).toBe(SPECIFIC);
    expect(submissionStatus(getSnapshotForTest().submissions[quest.id])).toBe("completed_in_app");
  });

  it("keeps tokens and completion after a reload", () => {
    saveDraft(quest.id, { text: SPECIFIC, photo: null });
    completeQuest(quest);
    reloadFromStorage();
    expect(tokenBalance(getSnapshotForTest())).toBe(quest.rewardTokens);
  });

  it("never marks anything as officially submitted", () => {
    saveDraft(quest.id, { text: SPECIFIC, photo: null });
    completeQuest(quest);
    const status = getSnapshotForTest().submissions[quest.id].participationStatus;
    expect(status).toBe("completed_in_app");
    expect(status).not.toBe("ready_for_official_submission");
  });

  it("stores a check together with the draft it was run on", async () => {
    saveDraft(quest.id, { text: SPECIFIC, photo: null });
    const result = await reviewDraft({ quest, text: SPECIFIC, hasPhoto: false });
    saveReview(quest.id, result, draftSignature(SPECIFIC, null));
    expect(getSnapshotForTest().submissions[quest.id].review?.signature).toBe(draftSignature(SPECIFIC, null));
  });
});
