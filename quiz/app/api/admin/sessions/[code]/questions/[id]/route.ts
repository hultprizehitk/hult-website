import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { deleteQuestion, updateQuestion } from "@/lib/quiz/questions";
import { getSessionByCode } from "@/lib/quiz/sessions";
import { codeSchema, objectIdSchema, questionInputSchema } from "@/lib/quiz/validation";

type Ctx = { params: Promise<{ code: string; id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  return handle(async () => {
    const p = await ctx.params;
    const code = codeSchema.parse(p.code);
    const id = objectIdSchema.parse(p.id);
    const input = questionInputSchema.parse(await req.json());
    await connectDB();
    await requireAdmin(req);
    const session = await getSessionByCode(code);
    return json({ question: await updateQuestion(session, id, input) });
  });
}

export async function DELETE(req: Request, ctx: Ctx) {
  return handle(async () => {
    const p = await ctx.params;
    const code = codeSchema.parse(p.code);
    const id = objectIdSchema.parse(p.id);
    await connectDB();
    await requireAdmin(req);
    const session = await getSessionByCode(code);
    await deleteQuestion(session, id);
    return json({ ok: true });
  });
}
