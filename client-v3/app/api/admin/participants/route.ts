import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Team from "@/models/Team";
import { isAuthorizedAdmin } from "@/lib/admin-check";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
}

export async function GET(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    const url = new URL(req.url);
    const rawSearch = url.searchParams.get("search")?.trim();
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limitParam = url.searchParams.get("limit");

    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (rawSearch) {
      const safeSearch = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
        { department: { $regex: safeSearch, $options: "i" } },
        { roll: { $regex: safeSearch, $options: "i" } },
        { phone: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(filter);

    let query = User.find(filter).sort({ createdAt: -1 });

    if (limitParam) {
      const limit = Math.max(1, Math.min(200, parseInt(limitParam, 10)));
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const students: any[] = await query.lean();

    // Enrich missing phone/roll from Team collection
    const missingEmails = students
      .filter((s) => !s.phone?.trim() || !s.roll?.trim())
      .map((s) => s.email.toLowerCase().trim());

    if (missingEmails.length > 0) {
      const teams = await Team.find({
        $or: [
          { leadEmail: { $in: missingEmails } },
          { "members.email": { $in: missingEmails } },
        ],
      })
        .sort({ createdAt: -1 })
        .lean();

      for (const s of students) {
        const email = s.email.toLowerCase().trim();
        const team = teams.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (t: any) =>
            t.leadEmail?.toLowerCase() === email ||
            (Array.isArray(t.members) &&
              t.members.some((m: { email?: string }) => m.email?.toLowerCase() === email))
        );

        if (team) {
          if (team.leadEmail?.toLowerCase() === email) {
            if (!s.phone?.trim() && team.lead?.phone) s.phone = team.lead.phone;
            if (!s.roll?.trim() && team.lead?.roll) s.roll = team.lead.roll;
          } else if (Array.isArray(team.members)) {
            const member = team.members.find(
              (m: { email?: string; phone?: string; roll?: string }) =>
                m.email?.toLowerCase() === email
            );
            if (member) {
              if (!s.phone?.trim() && member.phone) s.phone = member.phone;
              if (!s.roll?.trim() && member.roll) s.roll = member.roll;
            }
          }
        }
      }
    }

    return NextResponse.json(
      {
        participants: students,
        total,
        page,
        totalPages: limitParam ? Math.ceil(total / Math.max(1, parseInt(limitParam, 10))) : 1,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Admin GET participants error:", error);
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 });
  }
}
