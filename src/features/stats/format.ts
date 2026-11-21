const KIND_LABELS: Record<string, string> = {
  elevator: "Elevators",
  escalator: "Escalators",
  access: "Access issues",
};

export function kindLabel(kind: string) {
  return KIND_LABELS[kind] ?? kind;
}

/** 5 -> "5 h", 72 -> "3 days". Anything under two days stays in hours. */
export function formatHours(hours: number | null) {
  if (hours === null) return "no data";
  if (hours < 48) return `${Math.round(hours * 10) / 10} h`;
  const days = Math.round((hours / 24) * 10) / 10;
  return `${days} days`;
}

export function formatPercent(value: number | null) {
  return value === null ? "no data yet" : `${value}%`;
}

/** "2026-06" -> "Jun 2026". Built from the parts so the time zone cannot shift the month. */
export function formatMonth(month: string) {
  const [year, m] = month.split("-").map(Number);
  if (!year || !m) return month;
  const name = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1];
  return name ? `${name} ${year}` : month;
}

export function formatDate(iso: string | null) {
  if (!iso) return "unknown";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "America/New_York" });
}

/** Width for a bar, as a percent of the biggest value, never invisible for a non-zero value. */
export function barPercent(value: number, max: number) {
  if (max <= 0 || value <= 0) return 0;
  return Math.max(3, Math.round((value / max) * 100));
}
