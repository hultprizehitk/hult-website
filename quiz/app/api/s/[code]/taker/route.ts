import { requireActor } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { setTaker } from "@/lib/quiz/teams";
import { codeSchema, takerSchema } from "@/lib/quiz/validation";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    const { email } = takerSchema.parse(await req.json());
    const actor = await requireActor(req);
    const team = await setTaker(code, actor.email, email);
    return json({ takerEmail: team.takerEmail });
  });
}
