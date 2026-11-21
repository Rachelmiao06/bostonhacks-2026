"use client";

import { useEffect, useState } from "react";
import { content, settings } from "./content";
import {
  deletePhoto,
  getPhoto,
  metaFor,
  photoTypeProblem,
  putPhoto,
  readAsDataUrl,
  shrinkPhoto,
  validatePhoto,
  type PhotoMeta,
} from "./photo";
import { reviewDraft, type ReviewResult } from "./review";
import type { Quest } from "./sample-quests";
import { completeQuest, draftSignature, saveDraft, saveReview, type AppState } from "./storage";

/**
 * THE CONTRACT FOR ANY SUBMIT SCREEN.
 *
 * This hook owns every rule of the submit flow: drafts, one photo, the AI check, "the check is out
 * of date after an edit", when Check and Complete unlock, tokens once per quest, and persistence.
 * A screen only has to render what it returns and call its actions. Redesign the screen as much as
 * you like; if it keeps using this hook, the flow keeps working. Tests for this contract are parked for a separate PR (see README).
 *
 * Call it only after `useAppState()` returned a value (it is null on the server and while hydrating).
 */

export type PhotoState = { meta: PhotoMeta; previewUrl: string };

/** Why Complete is locked, or why Check is locked. null means nothing to tell the player. */
export type SubmissionHint = "add_content" | "needs_check" | "needs_pass" | null;

export type SubmissionStatus = "empty" | "draft" | "reviewed" | "completed_in_app";

export function useSubmission(quest: Quest, state: AppState) {
  const saved = state.submissions[quest.id];
  const completed = saved?.participationStatus === "completed_in_app";

  const [text, setTextState] = useState(saved?.text ?? "");
  const [photo, setPhoto] = useState<PhotoState | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Bring back a saved photo from this device's IndexedDB on first mount.
  const savedPhotoMeta = saved?.photo ?? null;
  useEffect(() => {
    if (!savedPhotoMeta) return;
    let cancelled = false;
    getPhoto(quest.id)
      .then(async (blob) => {
        if (cancelled) return;
        if (!blob) {
          setPhotoError("Your saved photo could not be found on this device, so it was removed from the draft.");
          saveDraft(quest.id, { text: saved?.text ?? "", photo: null });
          return;
        }
        setPhoto({ meta: savedPhotoMeta, previewUrl: await readAsDataUrl(blob) });
      })
      .catch(() => {
        if (!cancelled) setPhotoError("Your saved photo could not be loaded from this device.");
      });
    return () => {
      cancelled = true;
    };
    // Only on first mount for this quest: later photo changes come from this hook itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quest.id]);

  const signature = draftSignature(text, photo?.meta.signature ?? null);
  const savedReview = saved?.review ?? null;
  const reviewIsCurrent = savedReview?.signature === signature;
  const hasContent = text.trim().length > 0 || photo !== null;
  const passes = savedReview?.result.status === "reviewed";

  const canCheck = !completed && !checking && hasContent;
  const canComplete =
    !completed && hasContent && reviewIsCurrent && (passes || !settings.requirePassToComplete);

  const hint: SubmissionHint = completed
    ? null
    : !hasContent
      ? "add_content"
      : !reviewIsCurrent
        ? "needs_check"
        : !canComplete
          ? "needs_pass"
          : null;

  const status: SubmissionStatus = completed
    ? "completed_in_app"
    : reviewIsCurrent && passes
      ? "reviewed"
      : hasContent
        ? "draft"
        : "empty";

  function setText(value: string) {
    if (completed) return;
    setTextState(value);
    saveDraft(quest.id, { text: value, photo: photo?.meta ?? null });
  }

  async function pickPhoto(original: File, options?: { fromCamera?: boolean }) {
    if (completed) return;
    setPhotoError(null);
    const typeProblem = photoTypeProblem(original);
    if (typeProblem) {
      setPhotoError(typeProblem);
      return;
    }
    // Camera photos are always re-saved (smaller, no hidden location data). Any photo over the limit is shrunk once.
    const file =
      options?.fromCamera || original.size > settings.maxPhotoBytes ? await shrinkPhoto(original) : original;
    const problem = validatePhoto(file);
    if (problem) {
      setPhotoError(problem);
      return;
    }
    const meta = metaFor(file);
    let previewUrl: string;
    try {
      previewUrl = await readAsDataUrl(file);
    } catch {
      setPhotoError("That photo could not be read. Please try another.");
      return;
    }
    setPhoto({ meta, previewUrl });
    try {
      await putPhoto(quest.id, file);
      saveDraft(quest.id, { text, photo: meta });
    } catch {
      // Say so plainly: the photo is only in memory until the page closes.
      setPhotoError(
        "The photo could not be saved on this device. You can still check it now, but it will be lost if you refresh.",
      );
      saveDraft(quest.id, { text, photo: null });
    }
  }

  async function removePhoto() {
    if (completed) return;
    setPhoto(null);
    setPhotoError(null);
    saveDraft(quest.id, { text, photo: null });
    try {
      await deletePhoto(quest.id);
    } catch {
      // nothing else to clean up
    }
  }

  async function check() {
    if (!canCheck) return;
    setAiError(null);
    setChecking(true);
    const checkedSignature = signature;
    try {
      const result = await reviewDraft({ quest, text, hasPhoto: photo !== null });
      saveReview(quest.id, result, checkedSignature);
    } catch {
      setAiError(content.aiFailed); // the draft stays exactly as the player left it
    } finally {
      setChecking(false);
    }
  }

  function complete() {
    if (!canComplete) return;
    completeQuest(quest);
  }

  return {
    // draft
    text,
    setText,
    // photo
    photo,
    photoError,
    pickPhoto,
    removePhoto,
    // AI check
    review: savedReview ? ({ result: savedReview.result, isCurrent: reviewIsCurrent } satisfies { result: ReviewResult; isCurrent: boolean }) : null,
    checking,
    aiError,
    check,
    canCheck,
    // completion
    canComplete,
    complete,
    completed,
    hint,
    status,
    rewardTokens: quest.rewardTokens,
    /** True when tokens for this quest are already in the balance. */
    rewarded: state.rewards.some((r) => r.challengeId === quest.id),
  };
}

export type SubmissionApi = ReturnType<typeof useSubmission>;
