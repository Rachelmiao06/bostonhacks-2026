// POST /api/verifications: a rider's answer to a verify quest.
// Body: { questId, userId, verdict: "working" | "still_broken", note? }
// One answer per rider per quest. No AI check: this is a one-tap observation, not written feedback.
import type { NextRequest } from "next/server";
import { hasDb, query } from "@/lib/db";
import { VERIFY_REWARD_TOKENS } from "@/lib/mbta";

function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  if (!hasDb()) return bad("Database is not configured", 503);
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Body must be JSON");
  }
  const { questId, userId, verdict } = body;
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (typeof questId !== "string" || !questId) return bad("questId is required");
  if (typeof userId !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(userId)) return bad("userId is missing or not valid");
  if (verdict !== "working" && verdict !== "still_broken") return bad('verdict must be "working" or "still_broken"');
  if (note.length > 500) return bad("Note is longer than 500 characters");

  const [outage] = await query<{ recent: boolean | null }>(
    "SELECT resolved_at >= now() - interval '48 hours' AS recent FROM outages WHERE alert_id = $1",
    [questId],
  );
  if (!outage) return bad("Unknown quest", 404);
  if (outage.recent === null) return bad("MBTA has not marked this as fixed, so there is nothing to verify yet", 409);
  if (!outage.recent) return bad("This verify quest has expired", 409);

  const inserted = await query(
    `INSERT INTO verifications (alert_id, user_id, verdict, note) VALUES ($1, $2, $3, $4)
     ON CONFLICT (alert_id, user_id) DO NOTHING RETURNING alert_id`,
    [questId, userId, verdict, note],
  );
  if (inserted.length === 0) return bad("You already verified this one", 409);
  return Response.json({ verdict, tokensAwarded: VERIFY_REWARD_TOKENS });
}
