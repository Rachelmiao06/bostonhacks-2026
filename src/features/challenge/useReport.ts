"use client";

import { useEffect, useState } from "react";
import type { Quest } from "@/lib/mbta";
import type { Review } from "@/lib/ai";
import { getRiderId } from "@/lib/rider";
import { completeReport, loadMyProgress, reviewReport, saveHandOff } from "./api";
import { metaFor, photoTypeProblem, shrinkPhoto, validatePhoto } from "./photo";
import { settings } from "./content";
import type { PhotoState } from "./useSubmission";

/**
 * Rules for a report quest on /challenges/[id]. The server is the source of truth
 * (/api/review saves the check, /api/submissions completes it); this hook mirrors its rules so
 * buttons unlock at the same moment the server would accept them.
 * - The rider's words are kept in localStorage on every keystroke, so an error or reload never loses them.
 * - Photos stay in memory only: shrunk under 4 MB, sent with the check, never stored.
 * - Any edit after a check makes it "not checked"; Complete needs a passing check on the unchanged report.
 */

const draftKey = (questId: string) => `tparty:draft:${questId}`;
const SAVED_PHOTO = "photo-from-an-earlier-visit";

function readDraft(questId: string): string | null {
  try {
    return window.localStorage.getItem(draftKey(questId));
  } catch {
    return null;
  }
}

function writeDraft(questId: string, text: string) {
  try {
    window.localStorage.setItem(draftKey(questId), text);
  } catch {
    // Storage blocked: the text still lives in the form for this visit.
  }
}

type LastCheck = { review: Review; text: string; photoSig: string | null };
type Done = { tokens: number; already: boolean; handedOff: boolean; text: string; hasPhoto: boolean };
export type ReportStep = 0 | 1 | 2 | 3 | 4;

export function useReport(quest: Quest) {
  const [userId] = useState(getRiderId);
  const [text, setTextState] = useState(() => readDraft(quest.id) ?? "");
  const [photo, setPhoto] = useState<(PhotoState & { file: File }) | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<LastCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  // Bring back what the server already knows: a finished quest, or the last AI check.
  useEffect(() => {
    let cancelled = false;
    loadMyProgress(userId).then((res) => {
      if (cancelled || !res.ok) return;
      const mine = res.data.submissions.find((s) => s.alert_id === quest.id);
      if (!mine) return;
      if (mine.status === "completed") {
        setDone({ tokens: quest.rewardTokens, already: true, handedOff: mine.handed_off, text: mine.text, hasPhoto: mine.has_photo });
        setTextState(mine.text);
        return;
      }
      if (mine.ai_feedback && mine.ai_status !== "not_checked") {
        setLastCheck({ review: mine.ai_feedback, text: mine.text, photoSig: mine.has_photo ? SAVED_PHOTO : null });
      }
      setTextState((current) => current || mine.text);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, quest.id, quest.rewardTokens]);

  // Free the preview image when it is replaced or the page closes.
  useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo.previewUrl);
  }, [photo]);

  const trimmed = text.trim();
  const photoSig = photo?.meta.signature ?? null;
  const hasContent = trimmed.length > 0 || photo !== null;
  const tooLong = text.length > 2000;
  const isCurrent = lastCheck !== null && lastCheck.text === trimmed && lastCheck.photoSig === photoSig;
  const passed = isCurrent && lastCheck.review.status === "reviewed";

  const canCheck = !done && hasContent && !tooLong && !checking && !completing;
  const canComplete = !done && passed && !checking && !completing;

  const step: ReportStep = done
    ? 4
    : !hasContent
      ? 0
      : passed
        ? 3
        : lastCheck
          ? 2
          : 1;

  function setText(value: string) {
    if (done) return;
    setTextState(value);
    writeDraft(quest.id, value);
  }

  async function pickPhoto(original: File, options?: { fromCamera?: boolean }) {
    if (done) return;
    setPhotoError(null);
    const typeProblem = photoTypeProblem(original);
    if (typeProblem) return setPhotoError(typeProblem);
    // Camera photos are always re-saved (smaller, no hidden location data); others only when over the limit.
    const file = options?.fromCamera || original.size > settings.maxPhotoBytes ? await shrinkPhoto(original) : original;
    const problem = validatePhoto(file);
    if (problem) return setPhotoError(problem);
    setPhoto({ file, meta: metaFor(file), previewUrl: URL.createObjectURL(file) });
  }

  function removePhoto() {
    if (done) return;
    setPhoto(null);
    setPhotoError(null);
  }

  async function check() {
    if (!canCheck) return;
    setError(null);
    setChecking(true);
    const sent = { text: trimmed, photoSig };
    const res = await reviewReport({ questId: quest.id, userId, text: trimmed, photo: photo?.file ?? null });
    setChecking(false);
    if (res.ok) setLastCheck({ review: res.data.review, ...sent });
    else setError(res.message); // the text box is untouched
  }

  async function complete() {
    if (!canComplete) return;
    setError(null);
    setCompleting(true);
    const input = { questId: quest.id, userId, text: trimmed, hasPhoto: photo !== null };
    const res = await completeReport(input);
    setCompleting(false);
    if (res.ok) {
      setDone({ tokens: res.data.tokensAwarded, already: false, handedOff: false, text: trimmed, hasPhoto: input.hasPhoto });
    } else {
      setError(res.message);
    }
  }

  async function handOff() {
    if (!done || done.handedOff) return;
    const res = await saveHandOff({ questId: quest.id, userId, text: done.text, hasPhoto: done.hasPhoto });
    if (res.ok) setDone({ ...done, handedOff: true });
  }

  return {
    text, setText, tooLong,
    photo, photoError, pickPhoto, removePhoto,
    check, checking, canCheck,
    review: lastCheck ? { result: lastCheck.review, isCurrent } : null,
    complete, completing, canComplete,
    hasContent, step, error, done, handOff,
  };
}
