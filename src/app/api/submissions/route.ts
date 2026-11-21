// POST /api/submissions: save a rider's draft or completed report for one quest.
// GET  /api/submissions?userId=...: that rider's reports, completed quests and token balance.
import type { NextRequest } from "next/server";
import { hasDb, query } from "@/lib/db";
import { LIKE_REWARD_TOKENS, REWARD_TOKENS, VERIFY_REWARD_TOKENS } from "@/lib/mbta";

const MAX_TEXT = 2000;

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
  const verifications = await query<{ alert_id: string; verdict: string; created_at: string; station_name: string; header: string }>(
    `SELECT v.alert_id, v.verdict, v.created_at, o.station_name, o.header
     FROM verifications v JOIN outages o USING (alert_id) WHERE v.user_id = $1 ORDER BY v.created_at DESC`,
    [userId],
  );
  // Like stamps other riders pressed on this rider's reports. If the likes table is not created yet,
  // everything else keeps working and the count is simply zero.
  const likeCounts = new Map<string, number>();
  try {
    const rows = await query<{ submission_id: string; n: number }>(
      `SELECT l.submission_id, count(*)::int AS n FROM likes l JOIN submissions s ON s.id = l.submission_id
       WHERE s.user_id = $1 AND s.status = 'completed' GROUP BY l.submission_id`,
      [userId],
    );
    rows.forEach((r) => likeCounts.set(r.submission_id, r.n));
  } catch {}
  const withLikes = submissions.map((s) => ({ ...s, likes: likeCounts.get(s.id) ?? 0 }));
  const likesReceived = [...likeCounts.values()].reduce((sum, n) => sum + n, 0);
  const completed = submissions.filter((s) => s.status === "completed");
  return Response.json({
    submissions: withLikes,
    likesReceived,
    verifications,
    completedQuestIds: completed.map((s) => s.alert_id),
    verifiedQuestIds: verifications.map((v) => v.alert_id),
    // Tokens are counted, not stored: one reward per completed quest, one per check, one per like stamp received.
    tokenBalance: completed.length * REWARD_TOKENS + verifications.length * VERIFY_REWARD_TOKENS + likesReceived * LIKE_REWARD_TOKENS,
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

  const { questId, userId, hasPhoto, handedOff } = body;
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const status = body.status === "completed" ? "completed" : "draft";

  if (typeof questId !== "string" || !questId) return bad("questId is required");
  if (!validUserId(userId)) return bad("userId is missing or not valid");
  if (text.length > MAX_TEXT) return bad(`Text is longer than ${MAX_TEXT} characters`);
  if (!text && hasPhoto !== true) return bad("Add some text or a photo first");

  const [outage] = await query<{ resolved_at: string | null }>(
    "SELECT resolved_at FROM outages WHERE alert_id = $1",
    [questId],
  );
  if (!outage) return bad("Unknown quest", 404);

  const [existing] = await query<{ status: string; text: string; has_photo: boolean; ai_status: string }>(
    "SELECT status, text, has_photo, ai_status FROM submissions WHERE alert_id = $1 AND user_id = $2",
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

  // The AI result is only ever written by /api/review. Editing the report after a check cancels that check.
  const unchanged = existing !== undefined && existing.text === text && existing.has_photo === (hasPhoto === true);
  if (status === "completed" && !(unchanged && existing.ai_status === "reviewed")) {
    return bad("Run the AI check on this exact report and pass it before completing", 409);
  }

  const [saved] = await query<SubmissionRow>(
    `INSERT INTO submissions (alert_id, user_id, text, has_photo, status, handed_off, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $5 = 'completed' THEN now() END)
     ON CONFLICT (alert_id, user_id) DO UPDATE SET
       ai_status = CASE WHEN $7 THEN submissions.ai_status ELSE 'not_checked' END,
       ai_feedback = CASE WHEN $7 THEN submissions.ai_feedback END,
       text = EXCLUDED.text, has_photo = EXCLUDED.has_photo, status = EXCLUDED.status,
       handed_off = submissions.handed_off OR EXCLUDED.handed_off,
       completed_at = EXCLUDED.completed_at, updated_at = now()
     RETURNING id, alert_id, text, has_photo, ai_status, ai_feedback, revision_count, status, handed_off, updated_at, completed_at`,
    [questId, userId, text, hasPhoto === true, status, handedOff === true, unchanged],
  );

  return Response.json({
    submission: saved,
    tokensAwarded: status === "completed" ? REWARD_TOKENS : 0,
  });
}
