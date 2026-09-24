import { connectDB } from "@/lib/db";
import { requireActor } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { submitAnswer } from "@/lib/quiz/answers";
import { listQuestions } from "@/lib/quiz/questions";
import { getSessionByCode } from "@/lib/quiz/sessions";
import { answerSchema, codeSchema } from "@/lib/quiz/validation";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const receivedAt = new Date();
    const code = codeSchema.parse((await ctx.params).code);
    const input = answerSchema.parse(await req.json());
    await connectDB();
    const actor = await requireActor(req);
    const session = await getSessionByCode(code);
    const questions = await listQuestions(session._id);
    const { answer, duplicate } = await submitAnswer(session, questions, actor.email, input, receivedAt);
    return json({ optionIndex: answer.optionIndex, questionId: String(answer.questionId), duplicate });
  });
}
