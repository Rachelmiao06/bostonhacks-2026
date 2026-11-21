// GET /api/places/photo?name=places/<id>/photos/<ref>&w=480
// Streams one Google Places photo through our server so the API key never reaches the browser.
// Google requires the photo's author credit to be shown next to it (the ticket does that); photos are not stored here.
import type { NextRequest } from "next/server";

const NAME = /^places\/[A-Za-z0-9_-]{1,200}\/photos\/[A-Za-z0-9_-]{1,800}$/;

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name") ?? "";
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!NAME.test(name)) return new Response("bad name", { status: 400 });
  if (!key) return new Response("not configured", { status: 503 });
  const width = Math.min(800, Math.max(200, Number(request.nextUrl.searchParams.get("w")) || 480));

  try {
    const res = await fetch(`https://places.googleapis.com/v1/${name}/media?maxWidthPx=${width}`, {
      headers: { "X-Goog-Api-Key": key },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return new Response("no photo", { status: 502 });
    return new Response(res.body, { headers: { "Content-Type": type, "Cache-Control": "private, max-age=300" } });
  } catch {
    return new Response("no photo", { status: 502 });
  }
}
