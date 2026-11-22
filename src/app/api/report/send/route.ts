// v1: the send is SIMULATED. No outside-app route into Boston 311 was found (see docs/PRD-report.md).
// This route validates the draft and returns a demo case id. Nothing leaves our server.
import { createHash } from "node:crypto";
import { CATEGORY_NAMES, teamFor } from "@/features/report/categories";
import { inBoston } from "../_lib/boston";

export async function POST(req: Request) {
  let b: { serviceName?: string; description?: string; lat?: number; lng?: number; key?: string };
  try {
    b = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const description = (b.description ?? "").trim();
  if (!b.serviceName || !CATEGORY_NAMES.includes(b.serviceName)) return Response.json({ error: "Pick a category from the list." }, { status: 422 });
  if (description.length < 10 || description.length > 600) return Response.json({ error: "Describe the problem in a sentence or two." }, { status: 422 });
  if (typeof b.lat !== "number" || typeof b.lng !== "number" || !inBoston(b.lat, b.lng)) return Response.json({ error: "That spot is not in Boston." }, { status: 422 });

  // Same key (one draft) always gives the same case id, so a double tap never makes two cases.
  const id = createHash("sha256").update(String(b.key ?? `${b.lat},${b.lng},${description}`)).digest("hex").slice(0, 6).toUpperCase();
  return Response.json({ caseId: `TADA-${id}`, team: teamFor(b.serviceName), simulated: true });
}
