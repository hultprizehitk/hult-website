/** Team may play if confirmed and (when required) its registration is submitted. */
export function isTeamEligible(team: { status?: string; submissionStatus?: string }, requireSubmitted: boolean): boolean {
  return team.status === "confirmed" && (!requireSubmitted || team.submissionStatus === "submitted");
}

/** Lead first, then members; lowercased, de-duplicated, blank emails dropped. */
export function rosterMembers(
  lead: { name?: string; email?: string } | undefined,
  members: { name?: string; email?: string }[] | undefined,
): { name: string; email: string }[] {
  const seen = new Set<string>();
  const out: { name: string; email: string }[] = [];
  for (const p of [lead, ...(members ?? [])]) {
    const email = (p?.email ?? "").toLowerCase().trim();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    out.push({ name: p?.name?.trim() || email.split("@")[0], email });
  }
  return out;
}
