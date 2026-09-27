import { requireAdmin } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { addQuestion, reorderQuestions } from "@/lib/quiz/questions";
import { codeSchema, questionInputSchema, reorderSchema } from "@/lib/quiz/validation";

type Ctx = { params: Promise<{ code: string }> };

export async function POST(req: Request, ctx: Ctx) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    const input = questionInputSchema.parse(await req.json());
    await requireAdmin(req);
    return json({ question: await addQuestion(code, input) }, 201);
  });
}

export async function PUT(req: Request, ctx: Ctx) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    const { ids } = reorderSchema.parse(await req.json());
    await requireAdmin(req);
    return json({ questions: await reorderQuestions(code, ids) });
  });
}
