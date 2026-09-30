import { requireAdmin } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { QuizError } from "@/lib/quiz/errors";
import { codeSchema } from "@/lib/quiz/validation";
import { publishStandingsToMongo } from "@/lib/sync/mongo-publish";

/**
 * Re-publishes the session's current top 10 to MongoDB for the auction. Idempotent, so it is the safe
 * way to recover when the automatic publish on End failed or the standings changed after the quiz.
 * Requires the quiz to have finished at least one question, so a half-run leaderboard is never published.
 */
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    const admin = await requireAdmin(req);
    const result = await publishStandingsToMongo(code);
    if (!result.published && result.reason === "no_standings") {
      throw new QuizError("invalid_state", "This session has no graded standings to publish yet");
    }
    console.info(`[quiz publish] ${code} by ${admin.email} -> ${JSON.stringify(result)}`);
    return json({ result });
  });
}
