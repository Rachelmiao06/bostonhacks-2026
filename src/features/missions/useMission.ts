"use client";

import { useEffect, useState } from "react";
import type { Quest } from "@/lib/mbta";
import { getRiderId } from "@/lib/rider";
import { completeReport, loadMyProgress, reviewReport, sendVerification } from "@/features/challenge/api";
import { metaFor, photoTypeProblem, shrinkPhoto, validatePhoto } from "@/features/challenge/photo";
import { settings } from "@/features/challenge/content";
import { refreshProgress } from "@/features/explore/progress";
import { buildSummary, EMPTY_ANSWERS, submissionText, whenIsFirstHand, type Answers } from "./compose";
import { templateFor } from "./templates";

/**
 * The rules of one mission. The server stays the source of truth: /api/review checks the update,
 * /api/submissions (or /api/verifications) saves it. This hook only walks the rider through the steps,
 * keeps their answers (on this device, on every change) and never calls a step "done" before the server says saved.
 */

export type Step = "overview" | "when" | "status" | "note" | "review" | "done";
export const FORM_STEPS: Step[] = ["when", "status", "note"];

const key = (questId: string) => `tada:mission:${questId}`;

function read(questId: string): { step: Step; answers: Answers } | null {
  try {
    const raw = window.localStorage.getItem(key(questId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { step?: Step; answers?: Partial<Answers> };
    // A saved "review" or "done" is never restored: the rider re-enters the review on purpose.
    const step = parsed.step === "when" || parsed.step === "status" || parsed.step === "note" ? parsed.step : "overview";
    return { step, answers: { ...EMPTY_ANSWERS, ...parsed.answers } };
  } catch {
    return null;
  }
}

function write(questId: string, step: Step, answers: Answers) {
  try {
    window.localStorage.setItem(key(questId), JSON.stringify({ step, answers }));
  } catch {
    // Storage blocked: the answers still live in the screen for this visit.
  }
}

function clear(questId: string) {
  try {
    window.localStorage.removeItem(key(questId));
  } catch {}
}

export type Review =
  | { sig: string; state: "ready"; aiChecked: boolean }
  | { sig: string; state: "question"; question: string }
  | { sig: string; state: "stuck" }
  | { sig: string; state: "error"; message: string }
  /** Verify missions with "I couldn't tell": nothing can be saved. */
  | { sig: string; state: "nothing_to_save" };

export type Done = { already: boolean; text: string | null; stampsBefore: number | null };

export function useMission(quest: Quest) {
  const [userId] = useState(getRiderId);
  const [saved] = useState(() => read(quest.id));
  const [step, setStepState] = useState<Step>(saved?.step ?? "overview");
  const [answers, setAnswersState] = useState<Answers>(saved?.answers ?? EMPTY_ANSWERS);
  const [photo, setPhoto] = useState<{ file: File; previewUrl: string; signature: string } | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [checking, setChecking] = useState(false);
  const [followUpUsed, setFollowUpUsed] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  const verify = quest.mode === "verify";
  const template = templateFor(quest);
  const summary = buildSummary(quest, answers, photo !== null);
  const sig = summary ? `${submissionText(summary)}|${photo?.signature ?? ""}` : "";

  // Finished on an earlier visit? Show it as it was saved.
  useEffect(() => {
    let cancelled = false;
    loadMyProgress(userId).then((res) => {
      if (cancelled || !res.ok) return;
      const mine = res.data.submissions.find((s) => s.alert_id === quest.id && s.status === "completed");
      const checked = res.data.verifications.find((v) => v.alert_id === quest.id);
      if (mine || checked) {
        setDone({ already: true, text: mine?.text ?? null, stampsBefore: null });
        setStepState("done");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId, quest.id]);

  // Free the preview image when it is replaced or the panel closes.
  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo.previewUrl);
    },
    [photo],
  );

  function go(next: Step) {
    setStepState(next);
    if (next !== "review") setFollowUpUsed(false); // editing answers earns a fresh review
    if (next !== "done" && next !== "review") write(quest.id, next, answers);
  }

  function setAnswers(patch: Partial<Answers>) {
    const next = { ...answers, ...patch };
    setAnswersState(next);
    write(quest.id, step === "review" || step === "done" ? "note" : step, next);
  }

  async function pickPhoto(original: File, fromCamera: boolean) {
    setPhotoError(null);
    const typeProblem = photoTypeProblem(original);
    if (typeProblem) return setPhotoError(typeProblem);
    // Camera photos are always re-saved (smaller, no hidden location data); others only when over the limit.
    const file = fromCamera || original.size > settings.maxPhotoBytes ? await shrinkPhoto(original) : original;
    const problem = validatePhoto(file);
    if (problem) return setPhotoError(problem);
    setPhoto({ file, previewUrl: URL.createObjectURL(file), signature: metaFor(file).signature });
  }

  function removePhoto() {
    setPhoto(null);
    setPhotoError(null);
  }

  /** Review my update: build the summary, then ask the existing AI check (report missions only). */
  async function runReview(extra?: string) {
    const used = extra !== undefined;
    const current = used ? { ...answers, extra } : answers;
    if (used) setAnswersState(current);
    const s = buildSummary(quest, current, photo !== null);
    if (!s) return;
    const thisSig = `${submissionText(s)}|${photo?.signature ?? ""}`;
    setStep("review");

    if (verify) {
      setReview(s.tone === "unsure" ? { sig: thisSig, state: "nothing_to_save" } : { sig: thisSig, state: "ready", aiChecked: false });
      return;
    }
    setChecking(true);
    const res = await reviewReport({ questId: quest.id, userId, text: submissionText(s), photo: photo?.file ?? null });
    setChecking(false);
    if (!res.ok) return setReview({ sig: thisSig, state: "error", message: res.message });
    if (res.data.review.status === "reviewed") return setReview({ sig: thisSig, state: "ready", aiChecked: true });
    // Short or thin is never a failure. Ask ONE clear question, once; after that, say plainly we could not finish.
    const question = res.data.review.suggestions[0] ?? res.data.review.feedback;
    if (used || followUpUsed || !question) return setReview({ sig: thisSig, state: "stuck" });
    setFollowUpUsed(true);
    setReview({ sig: thisSig, state: "question", question });
  }

  function setStep(next: Step) {
    setStepState(next);
  }

  async function share(stampsBefore: number | null) {
    if (!summary || !review || review.state !== "ready" || sharing) return;
    setShareError(null);
    setSharing(true);
    const text = submissionText(summary);
    const res = verify
      ? await sendVerification({
          questId: quest.id,
          userId,
          verdict: summary.tone === "ok" ? "working" : "still_broken",
          note: [summary.when, summary.note].filter(Boolean).join(" · "),
        })
      : await completeReport({ questId: quest.id, userId, text, hasPhoto: photo !== null });
    setSharing(false);
    if (!res.ok) return setShareError(res.message); // answers stay put
    clear(quest.id);
    await refreshProgress(); // pins, chip and My World read the same store
    setDone({ already: false, text, stampsBefore });
    setStepState("done");
  }

  const canNextWhen = whenIsFirstHand(answers);
  const canNextStatus = answers.status !== null;

  return {
    quest, template, verify, step, go, answers, setAnswers, summary,
    photo, photoError, pickPhoto, removePhoto,
    review: review && review.sig === sig ? review : null,
    checking, runReview, sharing, shareError, share, done,
    canNextWhen, canNextStatus,
  };
}
