// GET /api/trains: where every subway train is right now. Refreshes every 15 seconds.
// Optional filter: /api/trains?line=Green
import type { NextRequest } from "next/server";
import { getTrains } from "@/lib/mbta";

export async function GET(request: NextRequest) {
  const line = request.nextUrl.searchParams.get("line")?.toLowerCase();
  try {
    const feed = await getTrains();
    const trains = line ? feed.trains.filter((t) => t.line.toLowerCase() === line) : feed.trains;
    return Response.json({ ...feed, trains });
  } catch (error) {
    console.error("MBTA trains fetch failed:", error);
    // Live positions cannot be faked from a saved copy, so the map should simply show no trains.
    return Response.json({ trains: [], fetchedAt: null, error: "Live trains are not available right now" }, { status: 503 });
  }
}
