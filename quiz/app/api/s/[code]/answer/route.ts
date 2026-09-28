import { requireActor } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { submitAnswer } from "@/lib/quiz/answers";
import { answerSchema, codeSchema } from "@/lib/quiz/validation";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const receivedAt = new Date(); // before any await, so latency never eats into the answer window
    const code = codeSchema.parse((await ctx.params).code);
    const input = answerSchema.parse(await req.json());
    const actor = await requireActor(req);
    return json(await submitAnswer(code, actor.email, input, receivedAt));
  });
}

/** Warm-up ping sent by phones during the 3 s lead-in, so a cold function never delays the first answers. */
export function GET() {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
