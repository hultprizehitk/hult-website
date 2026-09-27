import { requireActor } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { joinSession } from "@/lib/quiz/teams";
import { codeSchema, joinSchema } from "@/lib/quiz/validation";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    const { deviceId } = joinSchema.parse(await req.json());
    const actor = await requireActor(req);
    return json(await joinSession(code, actor.email, deviceId));
  });
}
