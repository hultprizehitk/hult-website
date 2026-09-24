import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { applyControl } from "@/lib/quiz/sessions";
import { summarizeSession } from "@/lib/quiz/state";
import { codeSchema, controlSchema } from "@/lib/quiz/validation";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    const action = controlSchema.parse(await req.json());
    await connectDB();
    const admin = await requireAdmin(req);
    const session = await applyControl(code, action);
    console.info(`[quiz control] ${code} ${action.type} by ${admin.email} -> v${session.stateVersion}`);
    return json({ session: summarizeSession(session) });
  });
}
