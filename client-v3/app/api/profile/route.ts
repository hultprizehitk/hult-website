import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Team from "@/models/Team";
import Event from "@/models/Event";
import { auth } from "@/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * GET /api/profile
 * Retrieves authenticated student's profile details (including phone, roll, department, academic year).
 * Automatically backfills phone & roll from past team registrations if available.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const email = session.user.email.toLowerCase().trim();
    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Backfill phone and roll from existing teams if missing in User record
    if (!user.phone?.trim() || !user.roll?.trim()) {
      const pastTeam = await Team.findOne({
        $or: [{ leadEmail: email }, { "members.email": email }],
      }).sort({ createdAt: -1 });

      if (pastTeam) {
        let foundPhone = "";
        let foundRoll = "";

        if (pastTeam.leadEmail === email) {
          foundPhone = pastTeam.lead?.phone || "";
          foundRoll = pastTeam.lead?.roll || "";
        } else {
          const mem = pastTeam.members.find(
            (m: { email?: string; phone?: string; roll?: string }) =>
              m.email?.toLowerCase() === email
          );
          if (mem) {
            foundPhone = mem.phone || "";
            foundRoll = mem.roll || "";
          }
        }

        let needsSave = false;
        if (!user.phone?.trim() && foundPhone.trim()) {
          user.phone = foundPhone.trim();
          needsSave = true;
        }
        if (!user.roll?.trim() && foundRoll.trim()) {
          user.roll = foundRoll.trim();
          needsSave = true;
        }

        if (needsSave) {
          await user.save();
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image || "",
        department: user.department,
        year: user.year,
        phone: user.phone || "",
        roll: user.roll || "",
        role: user.role,
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile: " + (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Allows the student to edit and save their phone number and college roll number.
 * Propagates changes to active teams and registered teams for data consistency.
 */
export async function PATCH(req: Request) {
  try {
    const rateLimit = checkRateLimit(getClientIp(req), { limit: 20, windowMs: 60 * 1000 });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const email = session.user.email.toLowerCase().trim();
    const body = await req.json();
    const { name, phone, roll } = body;

    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanPhone = typeof phone === "string" ? phone.replace(/\D/g, "").trim() : "";
    const cleanRoll = typeof roll === "string" ? roll.replace(/\D/g, "").trim() : "";

    if (phone !== undefined && (!cleanPhone || cleanPhone.length !== 10 || !/^\d{10}$/.test(cleanPhone))) {
      return NextResponse.json(
        { error: "Contact Phone must be a valid 10-digit number." },
        { status: 400 }
      );
    }

    if (roll !== undefined && (!cleanRoll || !/^\d+$/.test(cleanRoll))) {
      return NextResponse.json(
        { error: "College Roll Number must contain numbers only." },
        { status: 400 }
      );
    }

    await connectDB();

    const updateSet: Record<string, string> = {};
    if (phone !== undefined) updateSet.phone = cleanPhone;
    if (roll !== undefined) updateSet.roll = cleanRoll;
    if (cleanName) updateSet.name = cleanName;

    if (Object.keys(updateSet).length === 0) {
      return NextResponse.json({ error: "No valid fields provided for update." }, { status: 400 });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { $set: updateSet },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Propagate name, phone and roll to all teams where user is lead
    const leadSet: Record<string, string> = {};
    if (phone !== undefined) leadSet["lead.phone"] = cleanPhone;
    if (roll !== undefined) leadSet["lead.roll"] = cleanRoll;
    if (cleanName) leadSet["lead.name"] = cleanName;

    if (Object.keys(leadSet).length > 0) {
      await Team.updateMany({ leadEmail: email }, { $set: leadSet });
    }

    // Propagate name, phone and roll to all teams where user is a member
    const memberSet: Record<string, string> = {};
    if (phone !== undefined) memberSet["members.$[elem].phone"] = cleanPhone;
    if (roll !== undefined) memberSet["members.$[elem].roll"] = cleanRoll;
    if (cleanName) memberSet["members.$[elem].name"] = cleanName;

    if (Object.keys(memberSet).length > 0) {
      await Team.updateMany(
        { "members.email": email },
        { $set: memberSet },
        { arrayFilters: [{ "elem.email": email }] }
      );
    }

    // Propagate to Event.registeredTeams if user is lead
    const regLeadSet: Record<string, string> = {};
    if (phone !== undefined) regLeadSet["registeredTeams.$[t].leadPhone"] = cleanPhone;
    if (cleanName) regLeadSet["registeredTeams.$[t].leadName"] = cleanName;

    if (Object.keys(regLeadSet).length > 0) {
      await Event.updateMany(
        { "registeredTeams.leadEmail": email },
        { $set: regLeadSet },
        { arrayFilters: [{ "t.leadEmail": email }] }
      );
    }

    // Propagate to Event.registeredTeams members if user is member
    const regMemberSet: Record<string, string> = {};
    if (cleanName) regMemberSet["registeredTeams.$[].members.$[m].name"] = cleanName;
    if (phone !== undefined) regMemberSet["registeredTeams.$[].members.$[m].phone"] = cleanPhone;
    if (roll !== undefined) regMemberSet["registeredTeams.$[].members.$[m].roll"] = cleanRoll;

    if (Object.keys(regMemberSet).length > 0) {
      await Event.updateMany(
        { "registeredTeams.members.email": email },
        { $set: regMemberSet },
        { arrayFilters: [{ "m.email": email }] }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile details updated successfully",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image || "",
        department: user.department,
        year: user.year,
        phone: user.phone || "",
        roll: user.roll || "",
        role: user.role,
      },
    });
  } catch (error: unknown) {
    console.error("PATCH /api/profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile: " + (error as Error).message },
      { status: 500 }
    );
  }
}
