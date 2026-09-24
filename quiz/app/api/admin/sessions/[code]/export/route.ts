import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/actor";
import { handle } from "@/lib/http";
import { buildExportCsv } from "@/lib/quiz/state";
import { codeSchema } from "@/lib/quiz/validation";

export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const code = codeSchema.parse((await ctx.params).code);
    await connectDB();
    await requireAdmin(req);
    const { filename, csv } = await buildExportCsv(code);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  });
}
