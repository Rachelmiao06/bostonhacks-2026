// Calls to the existing API routes. Every failure comes back as a plain-words message.
import type { Review } from "@/lib/ai";
import { flow } from "./content";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

async function call<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    return { ok: false, status: 0, message: flow.errors.network };
  }
  const body = await res.json().catch(() => null);
  if (res.ok) return { ok: true, data: body as T };
  const apiMessage = typeof body?.error === "string" ? body.error : null;
  // 502 messages name the AI service's status code; riders get a plain sentence instead.
  const message = res.status === 502 ? flow.errors.ai : (apiMessage ?? flow.errors.fallback);
  return { ok: false, status: res.status, message };
}

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export function reviewReport(input: { questId: string; userId: string; text: string; photo: File | null }) {
  const form = new FormData();
  form.set("questId", input.questId);
  form.set("userId", input.userId);
  form.set("text", input.text);
  if (input.photo) form.set("photo", input.photo);
  return call<{ review: Review }>("/api/review", { method: "POST", body: form });
}

type SubmissionInput = { questId: string; userId: string; text: string; hasPhoto: boolean };

export function completeReport(input: SubmissionInput) {
  return call<{ tokensAwarded: number }>("/api/submissions", json({ ...input, status: "completed" }));
}

export function saveHandOff(input: SubmissionInput) {
  return call<{ handedOff: boolean }>("/api/submissions", json({ ...input, handedOff: true }));
}

export function sendVerification(input: { questId: string; userId: string; verdict: "working" | "still_broken"; note: string }) {
  return call<{ verdict: string; tokensAwarded: number }>("/api/verifications", json(input));
}

export type MySubmission = {
  alert_id: string;
  text: string;
  has_photo: boolean;
  ai_status: string;
  ai_feedback: Review | null;
  status: string;
  handed_off: boolean;
};

export type MyProgress = {
  submissions: MySubmission[];
  verifications: { alert_id: string; verdict: "working" | "still_broken" }[];
};

export function loadMyProgress(userId: string) {
  return call<MyProgress>(`/api/submissions?userId=${encodeURIComponent(userId)}`);
}
