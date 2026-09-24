import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { parseQuestionsCsv } from "@/lib/quiz/csv-import";
import { importQuestions } from "@/lib/quiz/questions";
import { getSessionByCode } from "@/lib/quiz/sessions";
import { codeSchema, importSchema } from "@/lib/quiz/validation";

// POST {csv, mode, dryRun}: parse + validate; with dryRun:false and no errors, save the questions.
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    const { csv, mode, dryRun } = importSchema.parse(await req.json());
    await connectDB();
    const admin = await requireAdmin(req);
    const session = await getSessionByCode(code);
    const { questions, errors } = parseQuestionsCsv(csv);
    if (dryRun || errors.length > 0) return json({ imported: 0, preview: questions, errors });
    const saved = await importQuestions(session, questions, mode);
    console.info(`[quiz import] ${code} ${mode} ${questions.length} questions by ${admin.email}`);
    return json({ imported: questions.length, questions: saved, errors: [] });
  });
}
