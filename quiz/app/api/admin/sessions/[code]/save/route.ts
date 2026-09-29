import { requireAdmin } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { saveQuizSnapshot } from "@/lib/quiz/save-quiz";
import { codeSchema } from "@/lib/quiz/validation";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    const admin = await requireAdmin(req);
    const result = await saveQuizSnapshot(code, admin.email);
    console.info(`[quiz save] ${code} saved to Firebase DB by ${admin.email} (${result.totalTeams} teams, ${result.totalQuestions} questions)`);
    return json({ ok: true, result });
  });
}
