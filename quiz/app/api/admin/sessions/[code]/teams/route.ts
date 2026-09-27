import { requireAdmin } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { adminCheckin, adminReassignTaker, adminResetDevice } from "@/lib/quiz/teams";
import { codeSchema, teamAdminSchema } from "@/lib/quiz/validation";

// The console reads teams live from Firestore; this route only performs organizer overrides.
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    const input = teamAdminSchema.parse(await req.json());
    const admin = await requireAdmin(req);
    if (input.action === "checkin") await adminCheckin(code, input.teamId, admin.email);
    if (input.action === "reassign_taker") await adminReassignTaker(code, input.teamId, input.email);
    if (input.action === "reset_device") await adminResetDevice(code, input.teamId);
    console.info(`[quiz team] ${code} ${input.action} ${input.teamId} by ${admin.email}`);
    return json({ ok: true });
  });
}
