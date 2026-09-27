import { requireAdmin } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { parseQuestionsCsv } from "@/lib/quiz/csv-import";
import { importQuestions } from "@/lib/quiz/questions";
import { getSession, assertEditable } from "@/lib/quiz/sessions";
import { codeSchema, importSchema } from "@/lib/quiz/validation";

// POST {csv, mode, dryRun}: parse + validate; with dryRun:false and no errors, save the questions.
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    const { csv, mode, dryRun } = importSchema.parse(await req.json());
    const admin = await requireAdmin(req);
    assertEditable(await getSession(code), "Questions are locked once the quiz starts");
    const { questions, errors } = parseQuestionsCsv(csv);
    if (dryRun || errors.length > 0) return json({ imported: 0, preview: questions, errors });
    const saved = await importQuestions(code, questions, mode);
    console.info(`[quiz import] ${code} ${mode} ${questions.length} questions by ${admin.email}`);
    return json({ imported: questions.length, questions: saved, errors: [] });
  });
}
