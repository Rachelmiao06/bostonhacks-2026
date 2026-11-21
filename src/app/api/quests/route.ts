// GET /api/quests: current MBTA accessibility outages as Quests.
// Optional filter: /api/quests?line=Green
import type { NextRequest } from "next/server";
import { getQuests } from "@/lib/mbta";

export async function GET(request: NextRequest) {
  const line = request.nextUrl.searchParams.get("line");
  const feed = await getQuests();
  const quests = line
    ? feed.quests.filter((q) => q.lines.some((l) => l.toLowerCase() === line.toLowerCase()))
    : feed.quests;
  return Response.json({ ...feed, quests });
}
