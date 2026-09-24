import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { deleteSession, updateSessionMeta } from "@/lib/quiz/sessions";
import { getAdminView, summarizeSession } from "@/lib/quiz/state";
import { codeSchema, updateSessionSchema } from "@/lib/quiz/validation";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(req: Request, ctx: Ctx) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    await connectDB();
    await requireAdmin(req);
    return json(await getAdminView(code));
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    const patch = updateSessionSchema.parse(await req.json());
    await connectDB();
    await requireAdmin(req);
    return json({ session: summarizeSession(await updateSessionMeta(code, patch)) });
  });
}

export async function DELETE(req: Request, ctx: Ctx) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    await connectDB();
    await requireAdmin(req);
    await deleteSession(code);
    return json({ ok: true });
  });
}
