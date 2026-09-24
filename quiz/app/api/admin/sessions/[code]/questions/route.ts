import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { addQuestion, listQuestions, reorderQuestions } from "@/lib/quiz/questions";
import { getSessionByCode } from "@/lib/quiz/sessions";
import { codeSchema, questionInputSchema, reorderSchema } from "@/lib/quiz/validation";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(req: Request, ctx: Ctx) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    await connectDB();
    await requireAdmin(req);
    const session = await getSessionByCode(code);
    return json({ questions: await listQuestions(session._id) });
  });
}

export async function POST(req: Request, ctx: Ctx) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    const input = questionInputSchema.parse(await req.json());
    await connectDB();
    await requireAdmin(req);
    const session = await getSessionByCode(code);
    return json({ question: await addQuestion(session, input) }, 201);
  });
}

export async function PUT(req: Request, ctx: Ctx) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    const { ids } = reorderSchema.parse(await req.json());
    await connectDB();
    await requireAdmin(req);
    const session = await getSessionByCode(code);
    return json({ questions: await reorderQuestions(session, ids) });
  });
}
