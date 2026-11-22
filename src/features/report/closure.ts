// How a closed case is described. Closed is not the same as Fixed: say "Fixed" only when the city's own
// closure data supports it (reason Resolved AND a note that names a repair). Otherwise say "Closed" and quote the city.
const REPAIR = /\b(repaired|fixed|filled|replaced|removed|picked up|cleaned|cleared|collected|patched|swept|restored)\b/i;

export function closureView(team: string, reason: string | null, note: string | null) {
  const repaired = reason === "Resolved" && !!note && REPAIR.test(note);
  return {
    headline: repaired ? `Fixed by ${team}` : `Closed by ${team}`,
    /** The city's closure reason, verbatim. */
    reasonLine: reason ? `City's closure reason: ${reason}` : null,
    note: note?.trim() || null,
  };
}
