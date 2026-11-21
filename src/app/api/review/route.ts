// POST /api/review: run the AI check on a rider's report and save the result.
// Send multipart form data: questId, userId, text (optional), photo (optional file).
// The photo is sent to Gemini for this one check and is not stored by us.
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { AiError, reviewSubmission } from "@/lib/ai";
import { hasDb, query } from "@/lib/db";

const MAX_TEXT = 2000;
const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // 4 MB: Vercel rejects request bodies above 4.5 MB.
// Limits protect the Gemini quota. A new user id does not reset the per-address limit.
const MAX_CHECKS_PER_USER_PER_HOUR = 20;
const MAX_CHECKS_PER_ADDRESS_PER_HOUR = 60;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  if (!hasDb()) return bad("Database is not configured", 503);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bad("Send the report as form data");
  }
  const questId = form.get("questId");
  const userId = form.get("userId");
  const text = (typeof form.get("text") === "string" ? (form.get("text") as string) : "").trim();
  const file = form.get("photo");
  const photo = file instanceof File && file.size > 0 ? file : null;

  if (typeof questId !== "string" || !questId) return bad("questId is required");
  if (typeof userId !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(userId)) return bad("userId is missing or not valid");
  if (!text && !photo) return bad("Add some text or a photo first");
  if (text.length > MAX_TEXT) return bad(`Text is longer than ${MAX_TEXT} characters`);
  if (photo && !PHOTO_TYPES.includes(photo.type)) return bad("Please upload a JPG, PNG or WebP photo", 415);
  if (photo && photo.size > MAX_PHOTO_BYTES) return bad("Photo is larger than 4 MB. Please compress it or choose another", 413);

  const [outage] = await query<{ header: string; station_name: string; kind: string; resolved_at: string | null }>(
    "SELECT header, station_name, kind, resolved_at FROM outages WHERE alert_id = $1",
    [questId],
  );
  if (!outage) return bad("Unknown quest", 404);

  const [existing] = await query<{ status: string }>(
    "SELECT status FROM submissions WHERE alert_id = $1 AND user_id = $2",
    [questId, userId],
  );
  if (existing?.status === "completed") return bad("You already completed this quest", 409);
  if (!existing && outage.resolved_at) return bad("This quest has expired: MBTA resolved the outage", 409);

  const address = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const ipHash = createHash("sha256").update(address).digest("hex");
  const [usage] = await query<{ by_user: string; by_address: string }>(
    `SELECT count(*) FILTER (WHERE user_id = $1) by_user, count(*) FILTER (WHERE ip_hash = $2) by_address
     FROM review_calls WHERE called_at >= now() - interval '1 hour'`,
    [userId, ipHash],
  );
  if (Number(usage.by_user) >= MAX_CHECKS_PER_USER_PER_HOUR || Number(usage.by_address) >= MAX_CHECKS_PER_ADDRESS_PER_HOUR) {
    return bad("Too many AI checks in the last hour. Your report is not lost, please try again later.", 429);
  }
  await query("INSERT INTO review_calls (user_id, ip_hash) VALUES ($1, $2)", [userId, ipHash]);

  let review;
  try {
    review = await reviewSubmission({
      quest: { header: outage.header, stationName: outage.station_name, kind: outage.kind },
      text,
      photo: photo
        ? { mimeType: photo.type, base64: Buffer.from(await photo.arrayBuffer()).toString("base64") }
        : undefined,
    });
  } catch (error) {
    console.error("AI check failed:", error);
    // The rider's text is still in their form; nothing is marked as reviewed.
    const message = error instanceof AiError ? error.message : "AI check failed";
    return bad(`${message}. Your report is not lost, please try again.`, 502);
  }

  await query(
    `INSERT INTO submissions (alert_id, user_id, text, has_photo, ai_status, ai_feedback)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (alert_id, user_id) DO UPDATE SET
       revision_count = submissions.revision_count + 1,
       text = EXCLUDED.text, has_photo = EXCLUDED.has_photo,
       ai_status = EXCLUDED.ai_status, ai_feedback = EXCLUDED.ai_feedback, updated_at = now()`,
    [questId, userId, text, photo !== null, review.status, JSON.stringify(review)],
  );

  return Response.json({ review });
}
