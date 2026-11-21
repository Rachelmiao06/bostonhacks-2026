// GET /api/community?userId=...: recent completed reports from every rider, with their like stamps.
// Only reports that passed the AI check and have written text are shown. No rider id ever leaves the server:
// each author is a short anonymous handle, and `mine` says whether the report is the asker's own.
import type { NextRequest } from "next/server";
import { hasDb, query } from "@/lib/db";

const LIMIT = 40;

function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

type Row = {
  id: string;
  text: string;
  completed_at: string;
  station_name: string;
  header: string;
  kind: string;
  resolved_at: string | null;
  author: string;
  mine: boolean;
  likes: number;
  liked: boolean;
};

export async function GET(request: NextRequest) {
  if (!hasDb()) return bad("Database is not configured", 503);
  const userId = request.nextUrl.searchParams.get("userId");
  if (typeof userId !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(userId)) return bad("userId is missing or not valid");

  try {
    const posts = await query<Row>(
      `SELECT s.id, s.text, s.completed_at, o.station_name, o.header, o.kind, o.resolved_at,
              substr(md5(s.user_id), 1, 4) AS author,
              (s.user_id = $1) AS mine,
              (SELECT count(*)::int FROM likes l WHERE l.submission_id = s.id) AS likes,
              EXISTS (SELECT 1 FROM likes l WHERE l.submission_id = s.id AND l.user_id = $1) AS liked
       FROM submissions s JOIN outages o USING (alert_id)
       WHERE s.status = 'completed' AND s.ai_status = 'reviewed' AND length(btrim(s.text)) > 0
       ORDER BY s.completed_at DESC LIMIT ${LIMIT}`,
      [userId],
    );
    return Response.json({ posts });
  } catch {
    // The likes table has not been created yet (run scripts/db-setup.mjs).
    return bad("Community is not set up yet", 503);
  }
}
