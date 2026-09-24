import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { listQuestions } from "@/lib/quiz/questions";
import { getSessionByCode } from "@/lib/quiz/sessions";
import { adminCheckin, adminReassignTaker, adminResetDevice, teamBoard } from "@/lib/quiz/teams";
import { codeSchema, teamAdminSchema } from "@/lib/quiz/validation";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(req: Request, ctx: Ctx) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    await connectDB();
    await requireAdmin(req);
    const session = await getSessionByCode(code);
    const questions = await listQuestions(session._id);
    const current = session.currentIndex >= 0 ? (questions[session.currentIndex]?.id ?? null) : null;
    return json({ serverNow: Date.now(), teams: await teamBoard(session, current) });
  });
}

export async function POST(req: Request, ctx: Ctx) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    const input = teamAdminSchema.parse(await req.json());
    await connectDB();
    const admin = await requireAdmin(req);
    const session = await getSessionByCode(code);
    if (input.action === "checkin") await adminCheckin(session, input.teamId, admin.email);
    if (input.action === "reassign_taker") await adminReassignTaker(session, input.teamId, input.email);
    if (input.action === "reset_device") await adminResetDevice(session, input.teamId);
    console.info(`[quiz team] ${code} ${input.action} ${input.teamId} by ${admin.email}`);
    return json({ ok: true });
  });
}
