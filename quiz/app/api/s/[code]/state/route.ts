import { connectDB } from "@/lib/db";
import { getActor } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { QuizError } from "@/lib/quiz/errors";
import { getState } from "@/lib/quiz/state";
import { codeSchema } from "@/lib/quiz/validation";

export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    await connectDB();
    const actor = await getActor(req);
    const deviceId = new URL(req.url).searchParams.get("d");
    const state = await getState(code, actor, deviceId);
    if (!state) throw new QuizError("not_found", "Session not found");
    return json(state);
  });
}
