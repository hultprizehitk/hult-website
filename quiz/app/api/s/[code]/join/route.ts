import { requireActor } from "@/lib/actor";
import { isAdminEmail } from "@/lib/admin";
import { handle, json } from "@/lib/http";
import { joinSession } from "@/lib/quiz/teams";
import { codeSchema, joinSchema } from "@/lib/quiz/validation";
import { venueCheckStatus } from "@/lib/sync/mongo-read";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    const { deviceId, claim } = joinSchema.parse(await req.json());
    const actor = await requireActor(req);
    // Admins skip the desk scan here as they do at sign-in (organizers rehearsing on a team).
    const venueCheck = (await isAdminEmail(actor.email)) ? undefined : venueCheckStatus;
    return json(await joinSession(code, actor.email, deviceId, new Date(), { claim, venueCheck }));
  });
}
