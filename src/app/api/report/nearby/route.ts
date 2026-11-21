import { DataError, inBoston, nearbyOpenCases } from "../_lib/boston";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const lat = Number(p.get("lat"));
  const lng = Number(p.get("lng"));
  const service = p.get("service") ?? "";
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inBoston(lat, lng)) {
    return Response.json({ error: "That spot is not in Boston." }, { status: 422 });
  }
  try {
    return Response.json({ cases: await nearbyOpenCases(lat, lng, service) });
  } catch (e) {
    // The check could not run. The screen says so; it never pretends there are no duplicates.
    return Response.json({ error: e instanceof DataError ? e.message : "Could not check for nearby cases" }, { status: 503 });
  }
}
