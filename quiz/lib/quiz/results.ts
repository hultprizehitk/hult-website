import { adminDb } from "@/lib/firebase/admin";
import { standingsFromTeams } from "./client-state";
import { standingsCsv } from "./export";
import { paths, type TeamDoc } from "./fs-types";
import { getSession } from "./sessions";

/** CSV of final (or current) standings with each graded question's answer per team. */
export async function buildExportCsv(code: string): Promise<{ filename: string; csv: string }> {
  const s = await getSession(code);
  const teamsSnap = await adminDb().collection(paths.teams(code)).get();
  const teams = teamsSnap.docs.map((d) => d.data() as TeamDoc);
  const graded = s.plan.slice(0, s.gradedThrough + 1);
  const answers = teams.flatMap((t) =>
    graded
      .map((q) => ({ q, r: t.perQuestion?.[q.id] }))
      .filter(({ r }) => r && r.optionIndex !== null)
      .map(({ q, r }) => ({ teamId: t.teamId, questionId: q.id, optionIndex: r!.optionIndex as number, isCorrect: r!.correct, responseMs: r!.ms })),
  );
  const csv = standingsCsv({
    standings: standingsFromTeams(teams),
    teams: teams.map((t) => ({ teamId: t.teamId, teamCode: t.teamCode, takerEmail: t.takerEmail })),
    questions: graded.map((q) => ({ id: q.id })),
    answers,
  });
  return { filename: `quiz-${code}-results.csv`, csv };
}
