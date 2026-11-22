import { DataError, statusFor } from "../_lib/boston";

export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  try {
    return Response.json({ cases: await statusFor(ids) });
  } catch (e) {
    return Response.json({ error: e instanceof DataError ? e.message : "Could not load case status" }, { status: 503 });
  }
}
