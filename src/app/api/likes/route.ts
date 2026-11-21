// POST /api/likes: press a like stamp on another rider's completed report.
// Body: { submissionId, userId }. One stamp per rider per report, never removed, never on your own report.
// The author earns LIKE_REWARD_TOKENS, counted by /api/submissions from this table.
import type { NextRequest } from "next/server";
import { hasDb, query } from "@/lib/db";
import { LIKE_REWARD_TOKENS } from "@/lib/mbta";

function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (!hasDb()) return bad("Database is not configured", 503);
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Body must be JSON");
  }
  const { submissionId, userId } = body;
  if (typeof submissionId !== "string" || !UUID.test(submissionId)) return bad("submissionId is missing or not valid");
  if (typeof userId !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(userId)) return bad("userId is missing or not valid");

  const [post] = await query<{ user_id: string }>(
    "SELECT user_id FROM submissions WHERE id = $1 AND status = 'completed' AND ai_status = 'reviewed'",
    [submissionId],
  );
  if (!post) return bad("Unknown report", 404);
  if (post.user_id === userId) return bad("You cannot stamp your own report", 403);

  await query("INSERT INTO likes (submission_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [submissionId, userId]);
  const [count] = await query<{ n: number }>("SELECT count(*)::int AS n FROM likes WHERE submission_id = $1", [submissionId]);
  return Response.json({ likes: count.n, liked: true, tokensToAuthor: LIKE_REWARD_TOKENS });
}
