import { requireAdmin } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { deleteQuestion, updateQuestion } from "@/lib/quiz/questions";
import { codeSchema, questionIdSchema, questionInputSchema } from "@/lib/quiz/validation";

type Ctx = { params: Promise<{ code: string; id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  return handle(async () => {
    const p = await ctx.params;
    const code = codeSchema.parse(p.code);
    const id = questionIdSchema.parse(p.id);
    const input = questionInputSchema.parse(await req.json());
    await requireAdmin(req);
    return json({ question: await updateQuestion(code, id, input) });
  });
}

export async function DELETE(req: Request, ctx: Ctx) {
  return handle(async () => {
    const p = await ctx.params;
    const code = codeSchema.parse(p.code);
    const id = questionIdSchema.parse(p.id);
    await requireAdmin(req);
    await deleteQuestion(code, id);
    return json({ ok: true });
  });
}
