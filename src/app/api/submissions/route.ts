// POST /api/submissions: save a rider's draft or completed report for one quest.
// GET  /api/submissions?userId=...: that rider's reports, completed quests and token balance.
import type { NextRequest } from "next/server";
import { hasDb, query } from "@/lib/db";
import { REWARD_TOKENS } from "@/lib/mbta";

const MAX_TEXT = 2000;
const AI_STATUSES = ["not_checked", "needs_revision", "reviewed"];

function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

function validUserId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(value);
}

type SubmissionRow = {
  id: string;
  alert_id: string;
  text: string;
  has_photo: boolean;
  ai_status: string;
  ai_feedback: unknown;
  revision_count: number;
  status: string;
  handed_off: boolean;
  updated_at: string;
  completed_at: string | null;
  station_name?: string;
  header?: string;
  kind?: string;
  resolved_at?: string | null;
};

export async function GET(request: NextRequest) {
  if (!hasDb()) return bad("Database is not configured", 503);
  const userId = request.nextUrl.searchParams.get("userId");
  if (!validUserId(userId)) return bad("userId is missing or not valid");

  const submissions = await query<SubmissionRow>(
    `SELECT s.id, s.alert_id, s.text, s.has_photo, s.ai_status, s.ai_feedback, s.revision_count,
            s.status, s.handed_off, s.updated_at, s.completed_at,
            o.station_name, o.header, o.kind, o.resolved_at
     FROM submissions s JOIN outages o USING (alert_id)
     WHERE s.user_id = $1 ORDER BY s.updated_at DESC`,
    [userId],
  );
  const completed = submissions.filter((s) => s.status === "completed");
  return Response.json({
    submissions,
    completedQuestIds: completed.map((s) => s.alert_id),
    // Tokens are counted, not stored: one reward per completed quest, so no double rewards.
    tokenBalance: completed.length * REWARD_TOKENS,
  });
}

export async function POST(request: NextRequest) {
  if (!hasDb()) return bad("Database is not configured", 503);
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Body must be JSON");
  }

  const { questId, userId, hasPhoto, aiFeedback, handedOff } = body;
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const aiStatus = typeof body.aiStatus === "string" ? body.aiStatus : "not_checked";
  const status = body.status === "completed" ? "completed" : "draft";

  if (typeof questId !== "string" || !questId) return bad("questId is required");
  if (!validUserId(userId)) return bad("userId is missing or not valid");
  if (text.length > MAX_TEXT) return bad(`Text is longer than ${MAX_TEXT} characters`);
  if (!text && hasPhoto !== true) return bad("Add some text or a photo first");
  if (!AI_STATUSES.includes(aiStatus)) return bad("aiStatus is not valid");
  if (status === "completed" && aiStatus !== "reviewed") {
    return bad("Run the AI check and pass it before completing", 409);
  }

  const [outage] = await query<{ resolved_at: string | null }>(
    "SELECT resolved_at FROM outages WHERE alert_id = $1",
    [questId],
  );
  if (!outage) return bad("Unknown quest", 404);

  const [existing] = await query<{ status: string }>(
    "SELECT status FROM submissions WHERE alert_id = $1 AND user_id = $2",
    [questId, userId],
  );
  if (existing?.status === "completed") {
    // After completion the only thing that can still change is "opened the official MBTA form".
    if (handedOff === true) {
      await query("UPDATE submissions SET handed_off = true WHERE alert_id = $1 AND user_id = $2", [questId, userId]);
      return Response.json({ handedOff: true, tokensAwarded: 0 });
    }
    return bad("You already completed this quest", 409);
  }
  if (!existing && outage.resolved_at) return bad("This quest has expired: MBTA resolved the outage", 409);

  const [saved] = await query<SubmissionRow>(
    `INSERT INTO submissions (alert_id, user_id, text, has_photo, ai_status, ai_feedback, status, handed_off, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CASE WHEN $7 = 'completed' THEN now() END)
     ON CONFLICT (alert_id, user_id) DO UPDATE SET
       revision_count = submissions.revision_count
         + CASE WHEN submissions.text IS DISTINCT FROM EXCLUDED.text OR submissions.has_photo <> EXCLUDED.has_photo THEN 1 ELSE 0 END,
       text = EXCLUDED.text, has_photo = EXCLUDED.has_photo, ai_status = EXCLUDED.ai_status,
       ai_feedback = EXCLUDED.ai_feedback, status = EXCLUDED.status,
       handed_off = submissions.handed_off OR EXCLUDED.handed_off,
       completed_at = EXCLUDED.completed_at, updated_at = now()
     RETURNING id, alert_id, text, has_photo, ai_status, ai_feedback, revision_count, status, handed_off, updated_at, completed_at`,
    [questId, userId, text, hasPhoto === true, aiStatus, aiFeedback ? JSON.stringify(aiFeedback) : null, status, handedOff === true],
  );

  return Response.json({
    submission: saved,
    tokensAwarded: status === "completed" ? REWARD_TOKENS : 0,
  });
}
