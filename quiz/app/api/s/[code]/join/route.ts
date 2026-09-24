import { connectDB } from "@/lib/db";
import { requireActor } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { getSessionByCode } from "@/lib/quiz/sessions";
import { joinSession } from "@/lib/quiz/teams";
import { codeSchema, joinSchema } from "@/lib/quiz/validation";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    const { deviceId } = joinSchema.parse(await req.json());
    await connectDB();
    const actor = await requireActor(req);
    const session = await getSessionByCode(code);
    const result = await joinSession(session, actor.email, deviceId);
    return json({ role: result.role, deviceOk: result.deviceOk });
  });
}
