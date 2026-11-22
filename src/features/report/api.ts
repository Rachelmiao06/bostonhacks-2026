// Thin wrappers around the /api/report routes. Every failure becomes an Error with a message fit to show.
import type { ApiError, CheckResult, CityStatus, NearbyCase } from "./types";

export class ReportApiError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ReportApiError("No connection. Nothing was sent. Check your signal and try again.", "offline");
  }
  const body = (await res.json().catch(() => null)) as (T & Partial<ApiError>) | null;
  if (!res.ok || !body) throw new ReportApiError(body?.error ?? "Something went wrong. Nothing was sent.", body?.code);
  return body;
}

const post = (url: string, data: unknown) => call<never>(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });

export const checkPhoto = (d: { image: string; lat: number; lng: number; accuracy: number; note?: string; demo?: boolean }) => post("/api/report/check", d) as Promise<CheckResult>;

export const findNearby = async (lat: number, lng: number, service: string) =>
  (await call<{ cases: NearbyCase[] }>(`/api/report/nearby?${new URLSearchParams({ lat: String(lat), lng: String(lng), service })}`)).cases;

export const fetchStatus = async (ids: string[]) =>
  ids.length ? (await call<{ cases: CityStatus[] }>(`/api/report/status?ids=${ids.join(",")}`)).cases : [];

export const sendReport = (d: { serviceName: string; description: string; lat: number; lng: number; key: string }) =>
  post("/api/report/send", d) as Promise<{ caseId: string; team: string; simulated: boolean }>;

export type AskAnswer = { answer: string; source: { label: string; url: string } | null };

export const askTada = (d: { question: string; context: unknown }) => post("/api/report/ask", d) as Promise<AskAnswer>;
