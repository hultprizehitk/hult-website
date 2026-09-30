import { requireAdmin } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { applyControl } from "@/lib/quiz/sessions";
import { codeSchema, controlSchema } from "@/lib/quiz/validation";
import { publishStandingsToMongo } from "@/lib/sync/mongo-publish";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    const body = (await req.json()) as Record<string, unknown>;
    const action = controlSchema.parse(body);
    // Optional optimistic check: a stale console (double click, second admin) gets 409 instead of acting twice.
    const expectedVersion = typeof body.expectedVersion === "number" ? body.expectedVersion : undefined;
    const admin = await requireAdmin(req);
    const result = await applyControl(code, action, new Date(), expectedVersion);
    console.info(`[quiz control] ${code} ${action.type} by ${admin.email} -> v${result.stateVersion}`);

    // Ending the quiz seeds the auction. Never blocks the host action: Mongo is best effort, and the
    // standings stay in Firestore, so the lead can re-publish from the console if this fails.
    let published: { published: boolean; count: number; reason?: string } | null = null;
    if (result.status === "ended") {
      try {
        const r = await publishStandingsToMongo(code);
        published = { published: r.published, count: r.count, reason: r.reason };
      } catch (err) {
        console.error(`[quiz publish] ${code} failed:`, err);
        published = { published: false, count: 0, reason: "publish_failed" };
      }
    }
    return json({ session: result, published });
  });
}
