import { requireAdmin } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { applyControl } from "@/lib/quiz/sessions";
import { codeSchema, controlSchema } from "@/lib/quiz/validation";

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
    return json({ session: result });
  });
}
