import { requireAdmin } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { adminSummary } from "@/lib/quiz/client-state";
import { deleteSession, updateSessionMeta } from "@/lib/quiz/sessions";
import { codeSchema, updateSessionSchema } from "@/lib/quiz/validation";

type Ctx = { params: Promise<{ code: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    const patch = updateSessionSchema.parse(await req.json());
    await requireAdmin(req);
    return json({ session: adminSummary(await updateSessionMeta(code, patch)) });
  });
}

export async function DELETE(req: Request, ctx: Ctx) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    await requireAdmin(req);
    await deleteSession(code);
    return json({ ok: true });
  });
}
